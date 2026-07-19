package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"iotrack.live/computation.server.go/internal/report"
	"iotrack.live/computation.server.go/internal/repository"
)

// Typed errors the handler maps to the §34 response codes. Wrapped with
// detail at the return site; callers test with errors.Is.
var (
	ErrAssetNotFound     = errors.New("asset not found")               // 404 ASSET_NOT_FOUND
	ErrAssetAccessDenied = errors.New("asset access denied")           // 403 ASSET_ACCESS_DENIED
	ErrRangeTooLong      = errors.New("report range exceeds the limit") // 400 REPORT_VALIDATION_ERROR
)

// ActivityReportRequest carries everything the report needs. Identity comes
// from the JWT via the middleware — the handler copies it out of the request
// context; this layer never reads HTTP or context values itself. OrgID in
// particular is the only trusted organisation source (§20).
type ActivityReportRequest struct {
	AssetUUID string
	From      time.Time
	To        time.Time

	UserID int64
	OrgID  int64
}

// ActivityReportResult is the full §18/§19.3 ActivityReportResponse — it
// marshals field-for-field to the frontend contract file
// (web.frontend.vue/src/types/activity-report.type.ts), the authority.
// Stats feed the §37 log line only — they are not part of the response.
type ActivityReportResult struct {
	Report   ReportMeta               `json:"report"`
	Subject  ReportSubject            `json:"subject"`
	Summary  report.Summary           `json:"summary"`
	Segments []report.ActivitySegment `json:"segments"`

	Stats report.NormalizeStats `json:"-"`
}

// ReportMeta describes the report itself. Timezone is "UTC" for now — the
// org-timezone source is an open product decision (SPEC, pinned response);
// mode is "journey" for every tracker category until timeline mode exists.
type ReportMeta struct {
	From           time.Time `json:"from"`
	To             time.Time `json:"to"`
	GeneratedAt    time.Time `json:"generatedAt"`
	OrganisationID int64     `json:"organisationId"`
	Mode           string    `json:"mode"`
	Timezone       string    `json:"timezone"`
}

// ReportSubject identifies the asset. deviceId/deviceExternalId are optional
// in the contract and omitted until a device join earns its place (§45).
type ReportSubject struct {
	AssetID     int64  `json:"assetId"`
	AssetUUID   string `json:"assetUuid"`
	AssetName   string `json:"assetName"`
	TrackerType string `json:"trackerType"`
}

// trackerTypeOf maps app.assets.asset_type onto the contract's TrackerType.
// Nil or unknown values fall back to "vehicle", consistent with the
// range-limit and JourneyConfig defaults.
func trackerTypeOf(assetType *string) string {
	if assetType != nil {
		switch *assetType {
		case "vehicle", "personal", "asset":
			return *assetType
		}
	}
	return "vehicle"
}

// GenerateActivityReport runs the Phase 1 sequence (§38): asset lookup →
// org check → per-user access check → range limit by tracker category →
// telemetry fetch. Every rejection happens before telemetry is touched
// (SPEC auth chain) — an unauthorised caller never costs a range scan.
func (s *Service) GenerateActivityReport(ctx context.Context, req ActivityReportRequest) (*ActivityReportResult, error) {

	// 1. Resolve the asset.
	asset, err := s.App.Repo.Asset.GetByUUID(ctx, req.AssetUUID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, fmt.Errorf("%w: %s", ErrAssetNotFound, req.AssetUUID)
	}
	if err != nil {
		return nil, err
	}

	// 2. Org check: the asset must belong to the JWT's active organisation.
	// A plain field comparison — see AccessRepository.UserHasAssetAccess for
	// why this is deliberately simpler than Node's org-scope computation.
	if asset.OrganisationID != req.OrgID {
		return nil, fmt.Errorf("%w: asset %s is not in organisation %d",
			ErrAssetAccessDenied, req.AssetUUID, req.OrgID)
	}

	// 3. Per-user override: only an explicit deny row removes access.
	allowed, err := s.App.Repo.Access.UserHasAssetAccess(ctx, req.UserID, asset.ID)
	if err != nil {
		return nil, err
	}
	if !allowed {
		return nil, fmt.Errorf("%w: user %d is denied asset %s",
			ErrAssetAccessDenied, req.UserID, req.AssetUUID)
	}

	// 4. Range limit by tracker category (§30). Checked here, not in the
	// handler, because the limit depends on the asset's type.
	maxDays := s.App.Config.MaxRangeDaysFor(asset.AssetType)
	if req.To.Sub(req.From) > time.Duration(maxDays)*24*time.Hour {
		return nil, fmt.Errorf("%w: %d days for this tracker category",
			ErrRangeTooLong, maxDays)
	}

	// 5. Fetch. No telemetry is a success with zero points, not an error (§34).
	rows, err := s.App.Repo.Telemetry.RangeByAsset(ctx, asset.ID, req.From, req.To)
	if err != nil {
		return nil, err
	}

	// 6. Normalise (§10): nothing past this line depends on raw DB column
	// names or vendor payload keys.
	points, stats := report.Normalize(rows)

	// 7. Segment (§14–§17) and summarise (§23). BuildSegments always returns
	// a non-nil slice, so an empty range marshals to [] rather than null.
	segments := report.BuildSegments(points, report.ConfigFor(asset.AssetType), req.From, req.To)

	return &ActivityReportResult{
		Report: ReportMeta{
			From:           req.From,
			To:             req.To,
			GeneratedAt:    time.Now().UTC(),
			OrganisationID: req.OrgID,
			Mode:           "journey",
			Timezone:       "UTC",
		},
		Subject: ReportSubject{
			AssetID:     asset.ID,
			AssetUUID:   asset.UUID,
			AssetName:   asset.Name,
			TrackerType: trackerTypeOf(asset.AssetType),
		},
		Summary:  report.Summarise(segments),
		Segments: segments,
		Stats:    stats,
	}, nil
}
