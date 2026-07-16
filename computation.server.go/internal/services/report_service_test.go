package services

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"iotrack.live/computation.server.go/internal/appcore"
	"iotrack.live/computation.server.go/internal/repository"
)

// testService builds a real Service against the dev database — the whole
// point of Step 7's verify is that the service is callable without HTTP.
// Gated behind RUN_DB_TESTS=1 like the repository tests; see the
// compute-dev-check skill for pointing DB_URL at the dev box.
func testService(t *testing.T) *Service {
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

	repo, err := repository.NewRepository(pool)
	if err != nil {
		t.Fatalf("building repositories: %v", err)
	}

	app := &appcore.App{DB: pool, Repo: repo, Config: appcore.LoadConfig()}
	return NewService(app)
}

// realAsset returns the uuid and organisation id of some asset in the dev
// database, so tests never hardcode ids that may age out.
func realAsset(t *testing.T, s *Service) (uuid string, orgID int64) {
	t.Helper()

	err := s.App.Repo.Pool.QueryRow(context.Background(),
		`SELECT uuid::text, organisation_id FROM app.assets LIMIT 1`,
	).Scan(&uuid, &orgID)
	if err != nil {
		t.Skip("no assets in the dev database to test against")
	}
	return uuid, orgID
}

func TestGenerateActivityReport_AssetNotFound(t *testing.T) {
	s := testService(t)

	_, err := s.GenerateActivityReport(context.Background(), ActivityReportRequest{
		AssetUUID: "00000000-0000-0000-0000-000000000000",
		From:      time.Now().Add(-24 * time.Hour),
		To:        time.Now(),
		UserID:    999_999_999,
		OrgID:     1,
	})
	if !errors.Is(err, ErrAssetNotFound) {
		t.Fatalf("err = %v, want ErrAssetNotFound", err)
	}
}

func TestGenerateActivityReport_WrongOrgIsDenied(t *testing.T) {
	s := testService(t)
	uuid, orgID := realAsset(t, s)

	_, err := s.GenerateActivityReport(context.Background(), ActivityReportRequest{
		AssetUUID: uuid,
		From:      time.Now().Add(-24 * time.Hour),
		To:        time.Now(),
		UserID:    999_999_999,
		OrgID:     orgID + 999, // definitely not the asset's organisation
	})
	if !errors.Is(err, ErrAssetAccessDenied) {
		t.Fatalf("err = %v, want ErrAssetAccessDenied", err)
	}
}

func TestGenerateActivityReport_RangeOverLimit(t *testing.T) {
	s := testService(t)
	uuid, orgID := realAsset(t, s)

	// 100 days exceeds every category's default limit (7/14/31).
	_, err := s.GenerateActivityReport(context.Background(), ActivityReportRequest{
		AssetUUID: uuid,
		From:      time.Now().Add(-100 * 24 * time.Hour),
		To:        time.Now(),
		UserID:    999_999_999,
		OrgID:     orgID,
	})
	if !errors.Is(err, ErrRangeTooLong) {
		t.Fatalf("err = %v, want ErrRangeTooLong", err)
	}
}

func TestGenerateActivityReport_HappyPath(t *testing.T) {
	s := testService(t)
	uuid, orgID := realAsset(t, s)

	from := time.Now().Add(-24 * time.Hour)
	to := time.Now()

	result, err := s.GenerateActivityReport(context.Background(), ActivityReportRequest{
		AssetUUID: uuid,
		From:      from,
		To:        to,
		UserID:    999_999_999, // no override row -> access defaults to allowed
		OrgID:     orgID,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.Subject.AssetUUID != uuid {
		t.Fatalf("subject uuid = %s, want %s", result.Subject.AssetUUID, uuid)
	}
	if result.RawPointCount != len(result.Points) {
		t.Fatalf("rawPointCount = %d but %d points", result.RawPointCount, len(result.Points))
	}
	if result.Points == nil {
		t.Fatal("points must be an empty slice, never nil — it marshals to [] not null")
	}

	// The count must agree with the database itself.
	var asset struct{ id int64 }
	if err := s.App.Repo.Pool.QueryRow(context.Background(),
		`SELECT id FROM app.assets WHERE uuid = $1`, uuid).Scan(&asset.id); err != nil {
		t.Fatalf("reading asset id: %v", err)
	}
	var want int
	if err := s.App.Repo.Pool.QueryRow(context.Background(),
		`SELECT count(*) FROM app.telemetry WHERE asset_id = $1 AND happened_at BETWEEN $2 AND $3`,
		asset.id, from, to).Scan(&want); err != nil {
		t.Fatalf("counting telemetry: %v", err)
	}
	if result.RawPointCount != want {
		t.Fatalf("rawPointCount = %d, database says %d", result.RawPointCount, want)
	}
}
