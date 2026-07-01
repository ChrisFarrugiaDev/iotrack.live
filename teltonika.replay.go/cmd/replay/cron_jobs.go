package main

import (
	"os"
	"strings"

	"go.uber.org/zap"
	"iotrack.live/teltonika.replay.go/internal/appcore"
	"iotrack.live/teltonika.replay.go/internal/logger"
	"iotrack.live/teltonika.replay.go/internal/services"
)

const defaultLatestTelemetryFlushCron = "0,20,40 * * * * *"

func FlushLastTelemetryJob(s *services.Service) {
	s.FlushLastTelemetry()
}

func setupCrons(app *appcore.App, s *services.Service) {
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
