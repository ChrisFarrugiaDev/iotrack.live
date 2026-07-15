package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"iotrack.live/computation.server.go/internal/models"
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

// ActivityReportResult is the §38 Phase 1 deliverable. Points are the raw
// telemetry rows for now; Phase 2 replaces them with normalised points and
// Phase 3 with segments.
type ActivityReportResult struct {
	Subject       ReportSubject      `json:"subject"`
	RawPointCount int                `json:"rawPointCount"`
	Points        []models.Telemetry `json:"points"`
}

type ReportSubject struct {
	AssetUUID string    `json:"asset_uuid"`
	AssetName string    `json:"asset_name"`
	AssetType *string   `json:"asset_type"`
	From      time.Time `json:"from"`
	To        time.Time `json:"to"`
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
	points, err := s.App.Repo.Telemetry.RangeByAsset(ctx, asset.ID, req.From, req.To)
	if err != nil {
		return nil, err
	}
	if points == nil {
		points = []models.Telemetry{} // JSON [] rather than null
	}

	return &ActivityReportResult{
		Subject: ReportSubject{
			AssetUUID: asset.UUID,
			AssetName: asset.Name,
			AssetType: asset.AssetType,
			From:      req.From,
			To:        req.To,
		},
		RawPointCount: len(points),
		Points:        points,
	}, nil
}
