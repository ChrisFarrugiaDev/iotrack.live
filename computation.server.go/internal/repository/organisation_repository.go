package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// OrganisationRepository answers org-scope questions against
// app.organisations and app.user_organisation_access.
//
// GetOrgScope mirrors web.backend.node.ts's Organisation.getOrgScope, and
// GetUserOrgOverrides mirrors UserOrganisationAccess.getUserOrgOverrides —
// both by the same recursive-CTE / plain-select queries, so the report
// endpoint's notion of "which orgs can this user reach" matches Node's
// access-profile computation exactly, not the flat org_id equality this
// replaces (see report_service.go).
type OrganisationRepository struct {
	pool *pgxpool.Pool
}

func NewOrganisationRepository(pool *pgxpool.Pool) *OrganisationRepository {
	return &OrganisationRepository{pool: pool}
}

// GetOrgScope returns orgID plus every descendant organisation, walking
// parent_org_id — the same adjacency-list recursion Node's getOrgScope runs,
// not the path column (path has no supporting index and is maintained by a
// separate trigger/batch job, so it isn't a source Node itself relies on).
func (r *OrganisationRepository) GetOrgScope(ctx context.Context, orgID int64) ([]int64, error) {
	const query = `
		WITH RECURSIVE org_scope AS (
			SELECT id FROM app.organisations WHERE id = $1
			UNION ALL
			SELECT o.id FROM app.organisations o
			INNER JOIN org_scope os ON o.parent_org_id = os.id
		)
		SELECT id FROM org_scope`

	rows, err := r.pool.Query(ctx, query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scope []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		scope = append(scope, id)
	}
	return scope, rows.Err()
}

// GetUserOrgOverrides returns the user's org-level allow/deny rows, split
// into two ID lists — mirroring UserOrganisationAccess.getUserOrgOverrides
// (which returns raw rows) plus the controller's own allow/deny split
// (access-profile.controller.ts's computeAccessibleOrganisationIds).
func (r *OrganisationRepository) GetUserOrgOverrides(ctx context.Context, userID int64) (allow, deny []int64, err error) {
	const query = `
		SELECT organisation_id, is_allowed
		  FROM app.user_organisation_access
		 WHERE user_id = $1`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var orgID int64
		var isAllowed bool
		if err := rows.Scan(&orgID, &isAllowed); err != nil {
			return nil, nil, err
		}
		if isAllowed {
			allow = append(allow, orgID)
		} else {
			deny = append(deny, orgID)
		}
	}
	return allow, deny, rows.Err()
}
