package main

import (
	"os"
	"strings"

	"go.uber.org/zap"
	"iotrack.live/teltonika.parser.go/internal/appcore"
	"iotrack.live/teltonika.parser.go/internal/logger"
	"iotrack.live/teltonika.parser.go/internal/services"
)

const defaultLatestTelemetryFlushCron = "0,20,40 * * * * *"

func FlushLastTelemetryJob(s *services.Service) {
	s.FlushLastTelemetry()
}

// setupCrons registers the scheduled jobs and starts the cron scheduler.
// Currently there is one job: the latest-telemetry flush, which pushes the
// in-memory latest telemetry (LastTelemetryMap, for devices marked dirty in
// UpdatedDevices) outward to Redis. The schedule is set by the
// LATEST_TELEMETRY_FLUSH_CRON env var (seconds-precision cron expression);
// if unset it falls back to defaultLatestTelemetryFlushCron.
func setupCrons(app *appcore.App, s *services.Service) { // (ref:047)
	latestTelemetryFlushCron := strings.TrimSpace(os.Getenv("LATEST_TELEMETRY_FLUSH_CRON"))
	if latestTelemetryFlushCron == "" {
		latestTelemetryFlushCron = defaultLatestTelemetryFlushCron
	}

	_, err := app.Cron.AddFunc(latestTelemetryFlushCron, func() {
		defer func() {
			if r := recover(); r != nil {
				logger.Error("FlushLastTelemetryJob panicked", zap.Any("recover", r))
			}
		}()
		FlushLastTelemetryJob(s)
	})
	if err != nil {
		logger.Error("Failed to register latest telemetry flush cron",
			zap.String("env", "LATEST_TELEMETRY_FLUSH_CRON"),
			zap.String("value", latestTelemetryFlushCron),
			zap.Error(err),
		)
	}

	app.Cron.Start()
}
