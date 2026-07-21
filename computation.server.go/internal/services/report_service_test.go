package services

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"iotrack.live/computation.server.go/internal/appcore"
	"iotrack.live/computation.server.go/internal/report"
	"iotrack.live/computation.server.go/internal/repository"
)

// testService builds a real Service against the live database (PRODUCTION —
// these tests are read-only by design; keep them that way) — the whole
// point of Step 7's verify is that the service is callable without HTTP.
// Gated behind RUN_DB_TESTS=1 like the repository tests; see the
// compute-dev-check skill for pointing DB_URL at the production box.
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

// realAsset returns the uuid and organisation id of some asset in the live
// database, so tests never hardcode ids that may age out.
func realAsset(t *testing.T, s *Service) (uuid string, orgID int64) {
	t.Helper()

	err := s.App.Repo.Pool.QueryRow(context.Background(),
		`SELECT uuid::text, organisation_id FROM app.assets LIMIT 1`,
	).Scan(&uuid, &orgID)
	if err != nil {
		t.Skip("no assets in the live database to test against")
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

// TestGenerateActivityReport_DescendantOrgIsAllowed is the actual bug this
// covers: a caller whose JWT org is an ASCENDANT of the asset's own
// organisation must be granted access — the org check is a scope
// membership test (org + every descendant), not a flat equality. Confirmed
// against a real parent/child pair rather than a fixture, since the
// recursive CTE's correctness depends on the real parent_org_id chain.
func TestGenerateActivityReport_DescendantOrgIsAllowed(t *testing.T) {
	s := testService(t)

	var uuid string
	var childOrgID, parentOrgID int64
	err := s.App.Repo.Pool.QueryRow(context.Background(), `
		SELECT a.uuid::text, a.organisation_id, o.parent_org_id
		  FROM app.assets a
		  JOIN app.organisations o ON o.id = a.organisation_id
		 WHERE o.parent_org_id IS NOT NULL
		 LIMIT 1`,
	).Scan(&uuid, &childOrgID, &parentOrgID)
	if err != nil {
		t.Skip("no asset in a child organisation in the live database")
	}

	_, err = s.GenerateActivityReport(context.Background(), ActivityReportRequest{
		AssetUUID: uuid,
		From:      time.Now().Add(-24 * time.Hour),
		To:        time.Now(),
		UserID:    999_999_999, // no override row -> access defaults to allowed
		OrgID:     parentOrgID, // the asset's PARENT org, not its own
	})
	if err != nil {
		t.Fatalf("caller from the parent org of asset's organisation %d was denied: %v", childOrgID, err)
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
	if result.Report.Mode != "journey" || result.Report.Timezone != "UTC" {
		t.Fatalf("report meta = %+v, want mode journey, timezone UTC", result.Report)
	}
	if result.Report.OrganisationID != orgID {
		t.Fatalf("report organisationId = %d, want %d", result.Report.OrganisationID, orgID)
	}
	if result.Segments == nil {
		t.Fatal("segments must be an empty slice, never nil — it marshals to [] not null")
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
	if result.Stats.Raw != want {
		t.Fatalf("stats.Raw = %d, database says %d", result.Stats.Raw, want)
	}
}

// Phase 2 acceptance (§38): the served points are normalised — camelCase
// contract keys only, no raw DB column names downstream of the normaliser.
// Anchors its window to an asset's actual latest telemetry so the check can
// never silently pass on an empty range.
func TestGenerateActivityReport_NormalisedShape(t *testing.T) {
	s := testService(t)

	var uuid string
	var orgID int64
	var latest time.Time
	err := s.App.Repo.Pool.QueryRow(context.Background(), `
		SELECT a.uuid::text, a.organisation_id, max(t.happened_at)
		  FROM app.telemetry t JOIN app.assets a ON a.id = t.asset_id
		 GROUP BY a.uuid, a.organisation_id
		 ORDER BY max(t.happened_at) DESC LIMIT 1`,
	).Scan(&uuid, &orgID, &latest)
	if err != nil {
		t.Skip("no asset-scoped telemetry in the live database")
	}

	result, err := s.GenerateActivityReport(context.Background(), ActivityReportRequest{
		AssetUUID: uuid,
		From:      latest.Add(-time.Hour),
		To:        latest.Add(time.Minute),
		UserID:    999_999_999,
		OrgID:     orgID,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Stats.Accepted == 0 {
		t.Fatal("window anchored to latest telemetry returned no points")
	}

	// Points now live inside segments (§18) — pull one from the first
	// point-bearing segment for the shape check.
	point, ok := firstSegmentPoint(result.Segments)
	if !ok {
		t.Fatalf("no point-bearing segment in a %d-segment report over live data", len(result.Segments))
	}

	encoded, err := json.Marshal(point)
	if err != nil {
		t.Fatalf("marshalling a point: %v", err)
	}
	var keys map[string]any
	if err := json.Unmarshal(encoded, &keys); err != nil {
		t.Fatalf("re-reading a point: %v", err)
	}
	for _, contract := range []string{"id", "timestamp", "latitude", "longitude", "gpsValid"} {
		if _, ok := keys[contract]; !ok {
			t.Fatalf("normalised point missing %q: %s", contract, encoded)
		}
	}
	for _, raw := range []string{"happened_at", "device_id", "organisation_id", "telemetry"} {
		if _, ok := keys[raw]; ok {
			t.Fatalf("raw DB column %q leaked into the normalised point: %s", raw, encoded)
		}
	}
	if _, isString := keys["id"].(string); !isString {
		t.Fatalf("point id must be a JSON string (§18): %s", encoded)
	}
	if tag, present := keys["parameters"].(map[string]any); present {
		if v, ok := tag["ibutton"]; ok {
			if _, isString := v.(string); !isString {
				t.Fatalf("parameters.ibutton must be a JSON string: %#v", v)
			}
		}
	}
}

// firstSegmentPoint returns the first point of the first point-bearing
// segment — data gaps have none by contract (§8.4).
func firstSegmentPoint(segments []report.ActivitySegment) (report.TelemetryPoint, bool) {
	for _, segment := range segments {
		switch s := segment.(type) {
		case report.JourneySegment:
			if len(s.Points) > 0 {
				return s.Points[0], true
			}
		case report.ActiveStaticSegment:
			if len(s.Points) > 0 {
				return s.Points[0], true
			}
		case report.StationarySegment:
			if len(s.Points) > 0 {
				return s.Points[0], true
			}
		}
	}
	return report.TelemetryPoint{}, false
}

// Phase 3 Step 7 (§38): a real drive window served as segments. Anchored to
// the roadmap's cadence-survey days (the org-6 drive days, Jul 6–8 2026):
// at least one journey, at least one data gap (the survey counted 4 real
// gaps > 300s), and a summary that reconciles with the segments it was
// derived from.
func TestGenerateActivityReport_RealDriveWindow(t *testing.T) {
	s := testService(t)

	from := time.Date(2026, 7, 6, 0, 0, 0, 0, time.UTC)
	to := time.Date(2026, 7, 8, 0, 0, 0, 0, time.UTC)

	// The busiest asset in the window, so the test never hardcodes an id.
	var uuid string
	var orgID int64
	err := s.App.Repo.Pool.QueryRow(context.Background(), `
		SELECT a.uuid::text, a.organisation_id
		  FROM app.telemetry t JOIN app.assets a ON a.id = t.asset_id
		 WHERE t.happened_at BETWEEN $1 AND $2
		 GROUP BY a.uuid, a.organisation_id
		 ORDER BY count(*) DESC LIMIT 1`, from, to,
	).Scan(&uuid, &orgID)
	if err != nil {
		t.Skip("no asset-scoped telemetry in the drive window")
	}

	result, err := s.GenerateActivityReport(context.Background(), ActivityReportRequest{
		AssetUUID: uuid,
		From:      from,
		To:        to,
		UserID:    999_999_999,
		OrgID:     orgID,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var journeys, gaps int
	var distance float64
	var movingSecs, activeSecs, stationarySecs, gapSecs, points int
	for _, segment := range result.Segments {
		switch seg := segment.(type) {
		case report.JourneySegment:
			journeys++
			distance += seg.DistanceMeters
			movingSecs += seg.DurationSeconds
			points += len(seg.Points)
		case report.ActiveStaticSegment:
			activeSecs += seg.DurationSeconds
			points += len(seg.Points)
		case report.StationarySegment:
			stationarySecs += seg.DurationSeconds
			points += len(seg.Points)
		case report.DataGapSegment:
			gaps++
			gapSecs += seg.DurationSeconds
		}
	}

	if journeys == 0 {
		t.Fatal("expected at least one journey on a surveyed drive day")
	}
	if gaps == 0 {
		t.Fatal("expected data gaps — the cadence survey counted 4 real gaps > 300s")
	}

	sum := result.Summary
	if sum.JourneyCount != journeys ||
		sum.TotalDistanceMeters != distance ||
		sum.MovingSeconds != movingSecs ||
		sum.ActiveStaticSeconds != activeSecs ||
		sum.StationarySeconds != stationarySecs ||
		sum.CommunicationGapSeconds != gapSecs ||
		sum.PointCount != points {
		t.Fatalf("summary %+v does not reconcile with segments (journeys=%d distance=%.1f moving=%d active=%d stationary=%d gap=%d points=%d)",
			sum, journeys, distance, movingSecs, activeSecs, stationarySecs, gapSecs, points)
	}
}
