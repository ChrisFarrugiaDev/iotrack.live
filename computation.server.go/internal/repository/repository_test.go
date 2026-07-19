package repository

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// testRepos builds the real Repository aggregate against the live database
// (PRODUCTION — these tests are read-only by design; keep them that way) —
// exercising the same construction path production uses, including the
// upper/db session. Gated behind RUN_DB_TESTS=1 (same pattern as
// teltonika.parser.go's RUN_REDIS_TESTS) so `go test ./...` stays green on a
// machine with no database reachable — only an explicit opt-in touches the
// network. See the compute-dev-check skill for how to point DB_URL at the
// production box.
func testRepos(t *testing.T) *Repository {
	t.Helper()

	if os.Getenv("RUN_DB_TESTS") != "1" {
		t.Skip("set RUN_DB_TESTS=1 to run database integration tests")
	}

	dsn := os.Getenv("DB_URL")
	if dsn == "" {
		t.Fatal("DB_URL must be set when RUN_DB_TESTS=1")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("opening pool: %v", err)
	}
	t.Cleanup(pool.Close)

	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("pinging database: %v", err)
	}

	repos, err := NewRepository(pool)
	if err != nil {
		t.Fatalf("building repositories: %v", err)
	}

	return repos
}

func TestAssetRepository_GetByUUID_Unknown(t *testing.T) {
	repos := testRepos(t)

	_, err := repos.Asset.GetByUUID(context.Background(), "00000000-0000-0000-0000-000000000000")
	if err == nil {
		t.Fatal("expected an error for an asset uuid that does not exist, got nil")
	}
}

func TestAssetRepository_GetByUUID_Real(t *testing.T) {
	repos := testRepos(t)

	// A negative test alone would miss upper/db mis-scanning a real row (the
	// uuid column in particular: Postgres's native uuid type has bitten
	// naive string scanning before). Read whatever asset is first in the
	// live database and confirm the fields round-trip correctly.
	var wantUUID, wantName string
	var wantOrgID int64
	err := repos.Pool.QueryRow(context.Background(),
		`SELECT uuid::text, organisation_id, name FROM app.assets LIMIT 1`,
	).Scan(&wantUUID, &wantOrgID, &wantName)
	if err != nil {
		t.Skip("no assets in the live database to test against")
	}

	got, err := repos.Asset.GetByUUID(context.Background(), wantUUID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.UUID != wantUUID || got.OrganisationID != wantOrgID || got.Name != wantName {
		t.Fatalf("got %+v, want uuid=%s organisation_id=%d name=%s", got, wantUUID, wantOrgID, wantName)
	}
}

func TestTelemetryRepository_RangeByAsset_UnknownAssetIsEmpty(t *testing.T) {
	repos := testRepos(t)

	// An asset_id this large cannot exist (BIGSERIAL starts at 1) — this
	// exercises the "no rows, no error" path a real caller hits for an
	// asset with no telemetry in range, distinct from an asset lookup
	// failure (which is AssetRepository's job, not this one's).
	points, err := repos.Telemetry.RangeByAsset(context.Background(), 9_000_000_000, time.Unix(0, 0), time.Now())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(points) != 0 {
		t.Fatalf("got %d points for a nonexistent asset, want 0", len(points))
	}
}

func TestTelemetryRepository_RangeByAsset_SortedAscending(t *testing.T) {
	repos := testRepos(t)

	// Pick whichever real asset happens to have telemetry, rather than
	// hardcoding an id that may not exist (or may age out) in the live
	// database.
	var assetID int64
	err := repos.Pool.QueryRow(context.Background(),
		`SELECT asset_id FROM app.telemetry WHERE asset_id IS NOT NULL LIMIT 1`,
	).Scan(&assetID)
	if err != nil {
		t.Skip("no telemetry with an asset_id in the live database to test against")
	}

	points, err := repos.Telemetry.RangeByAsset(context.Background(), assetID, time.Unix(0, 0), time.Now())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(points) == 0 {
		t.Fatal("expected at least one point for an asset_id just read from app.telemetry")
	}

	for i := 1; i < len(points); i++ {
		if points[i].HappenedAt.Before(points[i-1].HappenedAt) {
			t.Fatalf("row %d (happened_at=%v) is out of order after row %d (happened_at=%v)",
				i, points[i].HappenedAt, i-1, points[i-1].HappenedAt)
		}
	}
}

func TestAccessRepository_HasPermission(t *testing.T) {
	repos := testRepos(t)
	ctx := context.Background()

	// Seeded by initdb-scripts/05-tables.sql: role 2 (admin) holds
	// report.view; role 4 (viewer) does not hold user.delete. A userID this
	// large has no app.user_permissions override, so the role default rules.
	const noOverrideUser = 999_999_999

	allowed, err := repos.Access.HasPermission(ctx, noOverrideUser, 2, "report.view")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !allowed {
		t.Fatal("role 2 (admin) should hold report.view per the seed")
	}

	allowed, err = repos.Access.HasPermission(ctx, noOverrideUser, 4, "user.delete")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if allowed {
		t.Fatal("role 4 (viewer) should not hold user.delete per the seed")
	}
}

func TestAccessRepository_UserHasAssetAccess_DefaultsToAllowed(t *testing.T) {
	repos := testRepos(t)

	// No row in app.user_asset_access for this pair, so Node's default
	// (present in scope => allowed) applies: absence of an override is not
	// a denial.
	allowed, err := repos.Access.UserHasAssetAccess(context.Background(), 999_999_999, 999_999_999)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !allowed {
		t.Fatal("access should default to allowed when no override row exists")
	}
}
