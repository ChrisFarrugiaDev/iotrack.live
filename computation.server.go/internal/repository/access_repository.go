package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// AccessRepository answers permission and access questions against
// app.permissions, app.role_permissions and app.user_permissions.
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
