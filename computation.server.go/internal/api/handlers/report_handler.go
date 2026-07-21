package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"go.uber.org/zap"

	"iotrack.live/computation.server.go/internal/api/middlewares"
	"iotrack.live/computation.server.go/internal/logger"
	"iotrack.live/computation.server.go/internal/services"
)

// reportGenerator is what this handler needs from the services layer —
// declared at the consumer so the error-mapping table can be tested with a
// fake instead of a live database (same rule as middlewares.permissionChecker).
type reportGenerator interface {
	GenerateActivityReport(ctx context.Context, req services.ActivityReportRequest) (*services.ActivityReportResult, error)
}

type ReportHandler struct {
	svc reportGenerator

	// sem is a counting semaphore: a buffered channel whose capacity
	// (REPORT_MAX_CONCURRENT) is the number of slots. Sending takes a slot
	// and blocks when full — that blocking is the queue; receiving frees
	// one. Built once at boot, so the limit is global across requests.
	// Full walkthrough: notes/03_semaphore_channel_pattern.md
	sem chan struct{}
}

func NewReportHandler(svc reportGenerator, maxConcurrent int) *ReportHandler {
	return &ReportHandler{
		svc: svc,
		sem: make(chan struct{}, maxConcurrent),
	}
}

// activityReportBody is the §19.2 v1 request: timestamps arrive as RFC3339
// strings and are converted to UTC on arrival (§21).
type activityReportBody struct {
	AssetUUID string `json:"asset_uuid"`
	From      string `json:"from"`
	To        string `json:"to"`

	// StationaryWindowSeconds overrides §14.3/§14.4's confirmation window
	// (Phase 5). Optional; omitted means the resolved profile's default.
	StationaryWindowSeconds *int `json:"stationary_window_seconds,omitempty"`
}

// Bounds for StationaryWindowSeconds (Phase 5 Step 0): 3-15 minutes.
const (
	minStationaryWindowSeconds = 180
	maxStationaryWindowSeconds = 900
)

// ActivityReport handles POST /compute/reports/activity. Validation here is
// shape-only (fields present, dates parseable, from < to); anything needing
// the asset — the range limit in particular — belongs to the service.
func (h *ReportHandler) ActivityReport(w http.ResponseWriter, r *http.Request) {

	var body activityReportBody
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid report filters.", "REPORT_VALIDATION_ERROR")
		return
	}

	if body.AssetUUID == "" || body.From == "" || body.To == "" {
		writeError(w, http.StatusBadRequest, "Invalid report filters.", "REPORT_VALIDATION_ERROR")
		return
	}

	from, err1 := time.Parse(time.RFC3339, body.From)
	to, err2 := time.Parse(time.RFC3339, body.To)
	if err1 != nil || err2 != nil || !from.Before(to) {
		writeError(w, http.StatusBadRequest, "Invalid report filters.", "REPORT_VALIDATION_ERROR")
		return
	}

	if body.StationaryWindowSeconds != nil {
		window := *body.StationaryWindowSeconds
		if window < minStationaryWindowSeconds || window > maxStationaryWindowSeconds {
			writeError(w, http.StatusBadRequest, "Invalid report filters.", "REPORT_VALIDATION_ERROR")
			return
		}
	}

	// Take a computation slot, or leave the queue if the client
	// disconnects while waiting. The defer returns the slot on every
	// exit path. Details: notes/03_semaphore_channel_pattern.md
	select {
	case h.sem <- struct{}{}:
		defer func() { <-h.sem }()
	case <-r.Context().Done():
		return
	}

	userID := middlewares.UserID(r.Context())
	orgID := middlewares.OrgID(r.Context())

	start := time.Now()
	result, err := h.svc.GenerateActivityReport(r.Context(), services.ActivityReportRequest{
		AssetUUID:               body.AssetUUID,
		From:                    from.UTC(),
		To:                      to.UTC(),
		StationaryWindowSeconds: body.StationaryWindowSeconds,
		UserID:                  userID,
		OrgID:                   orgID,
	})

	var outcome string

	switch {
	case err == nil:
		outcome = "ok"
		writeData(w, http.StatusOK, result)

	case errors.Is(err, services.ErrAssetNotFound):
		outcome = "asset_not_found"
		writeError(w, http.StatusNotFound, "Asset not found.", "ASSET_NOT_FOUND")

	case errors.Is(err, services.ErrAssetAccessDenied):
		outcome = "access_denied"
		writeError(w, http.StatusForbidden, "You do not have access to the selected asset.", "ASSET_ACCESS_DENIED")

	case errors.Is(err, services.ErrRangeTooLong):
		outcome = "range_too_long"
		writeError(w, http.StatusBadRequest, "Invalid report filters.", "REPORT_VALIDATION_ERROR")

	case errors.Is(err, context.Canceled):
		// Client is gone; nothing useful to write.
		outcome = "canceled"

	default:
		outcome = "server_error"
		logger.Error("activity report failed", zap.Error(err))
		writeError(w, http.StatusInternalServerError,
			"An unexpected error occurred. Please try again later.", "SERVER_ERROR")
	}

	// One line per serviced request (§37). Identifiers and counts only —
	// never telemetry payloads.
	rawCount, acceptedCount, invalidGPSCount, segmentCount := 0, 0, 0, 0
	if result != nil {
		rawCount = result.Stats.Raw
		acceptedCount = result.Stats.Accepted
		invalidGPSCount = result.Stats.InvalidGPS
		segmentCount = len(result.Segments)
	}
	logger.Info("activity report",
		zap.String("outcome", outcome),
		zap.Int64("user_id", userID),
		zap.Int64("org_id", orgID),
		zap.String("asset_uuid", body.AssetUUID),
		zap.Time("from", from.UTC()),
		zap.Time("to", to.UTC()),
		zap.Int("raw_point_count", rawCount),
		zap.Int("accepted_point_count", acceptedCount),
		zap.Int("invalid_gps_count", invalidGPSCount),
		zap.Int("segment_count", segmentCount),
		zap.Duration("duration", time.Since(start)),
	)
}
