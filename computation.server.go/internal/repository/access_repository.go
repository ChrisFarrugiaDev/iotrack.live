package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// AccessRepository answers permission and access questions against
// app.permissions, app.role_permissions and app.user_permissions.
//
// Notice there is no models.Access struct backing this repository, unlike
// Asset and Telemetry. A model describes the shape of a row you fetch and
// hand back to a caller (see models.Asset, models.Telemetry); every method
// here answers a yes/no question by joining across several tables and
// returns a plain bool, not a row. There is no entity to represent, so
// there is nothing to model — a repository is allowed to exist with no
// model behind it. Add one only if a method here starts returning actual
// rows (e.g. "list every permission a role holds" would want a
// models.Permission), not before.
type AccessRepository struct {
	pool *pgxpool.Pool
}

func NewAccessRepository(pool *pgxpool.Pool) *AccessRepository {
	return &AccessRepository{pool: pool}
}

// HasPermission mirrors web.backend.node.ts's AccessProfileController
// (getUserPermissions): a per-user override in app.user_permissions wins
// outright, grant or revoke, over the role's default. Only when no override
// exists for that user and key does the role's own permission set decide.
func (r *AccessRepository) HasPermission(ctx context.Context, userID, roleID int64, key string) (bool, error) {
	const query = `
		SELECT COALESCE(
			(SELECT up.is_allowed
			   FROM app.user_permissions up
			   JOIN app.permissions p ON p.perm_id = up.perm_id
			  WHERE up.user_id = $1 AND p.key = $3),
			EXISTS (
				SELECT 1
				  FROM app.role_permissions rp
				  JOIN app.permissions p ON p.perm_id = rp.perm_id
				 WHERE rp.role_id = $2 AND p.key = $3
			)
		)`

	var allowed bool
	err := r.pool.QueryRow(ctx, query, userID, roleID, key).Scan(&allowed)
	return allowed, err
}

// UserHasAssetAccess mirrors web.backend.node.ts's AccessProfileController
// (getAccessibleAssetsForUser), for the one case the report endpoint needs:
// deciding access to a single, already-identified asset.
//
// Node's real rule has two parts. First it computes the caller's accessible
// organisation scope (the org tree plus org-level overrides) and lists every
// asset inside it — so presence in that scope is the default grant (see
// OrganisationRepository, used by the caller for that half). Then it
// subtracts assets with an explicit deny row in app.user_asset_access. It
// also collects per-asset "allow" overrides, but never applies them to add
// assets outside the scope — that branch is unused in the Node source
// (marked with its own "can be implemented in the future" comment) — so an
// allow row does nothing beyond what the scope already grants.
//
// This method covers the second half only: only a deny row can take away
// access; anything else, including no row at all or an allow row, defaults
// to access granted. The org-scope half is the caller's responsibility
// (see report_service.go), done via OrganisationRepository.
func (r *AccessRepository) UserHasAssetAccess(ctx context.Context, userID, assetID int64) (bool, error) {
	const query = `
		SELECT COALESCE(
			(SELECT is_allowed FROM app.user_asset_access
			  WHERE user_id = $1 AND asset_id = $2),
			TRUE
		)`

	var allowed bool
	err := r.pool.QueryRow(ctx, query, userID, assetID).Scan(&allowed)
	return allowed, err
}
