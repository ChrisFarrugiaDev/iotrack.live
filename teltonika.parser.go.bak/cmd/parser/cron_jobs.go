package main

import (
	"go.uber.org/zap"
	"iotrack.live/internal/appcore"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/services"
)

func FlushLastTelemetryJob(s *services.Service) {
	s.FlushLastTelemetry()
}

func setupCrons(app *appcore.App, s *services.Service) {
	app.Cron.AddFunc("0,20,40 * * * * *", func() {

		defer func() {
			if r := recover(); r != nil {
				logger.Error("FlushLastTelemetryJob panicked", zap.Any("recover", r))
			}
		}()
		FlushLastTelemetryJob(s)
	})
	app.Cron.Start()
}
