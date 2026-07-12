package main

import (
	"context"
	"time"

	"go.uber.org/zap"

	"iotrack.live/teltonika.parser.go/internal/logger"
	"iotrack.live/teltonika.parser.go/internal/services"
)

// startSyncRoutines keeps device and organisation config flowing inward:
// DB -> Redis (shared cache) -> in-memory maps, so the packet pipeline can
// resolve devices/orgs without hitting the DB. It runs each sync once at
// startup, builds LastTsMap, then launches two ticker goroutines: DB -> Redis
// every minute and Redis -> memory every 20 seconds. Both exit on ctx cancel.
func startSyncRoutines(ctx context.Context, appService *services.Service) {

	// Initial sync at startup: DB -> Redis
	err := appService.SyncDevicesFromDBToRedis()
	if err != nil {
		logger.Error("Initial device sync from DB to Redis failed", zap.Error(err))
	}

	err = appService.SyncOrganisationsFromDBToRedis()
	if err != nil {
		logger.Error("Initial organisation sync from DB to Redis failed", zap.Error(err))
	}

	// Initial sync at startup: Redis -> in-memory map
	if err := appService.SyncDevicesFromRedisToVar(); err != nil {
		logger.Error("Initial device sync from Redis to in-memory variable failed", zap.Error(err))
	}

	if err := appService.SyncOrganisationsFromRedisToVar(); err != nil {
		logger.Error("Initial organisations sync from Redis to in-memory variable failed", zap.Error(err))
	}

	// Build in-memory LastTsMap map with the last telemetry timestamp for each device.
	appService.BuildDeviceTsMap()

	// Periodically sync devices from DB to Redis every minute. (ref:045)
	go func(ctx context.Context, ds *services.Service) {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				logger.Info("DB→Redis device sync goroutine exiting")
				return
			case <-ticker.C:
				if err := ds.SyncDevicesFromDBToRedis(); err != nil {
					logger.Error("Periodic device sync from DB to Redis failed", zap.Error(err))
				} else {
					logger.Debug("Periodic device sync from DB to Redis completed successfully")
				}

				if err := ds.SyncOrganisationsFromDBToRedis(); err != nil {
					logger.Error("Periodic organisation sync from DB to Redis failed", zap.Error(err))
				} else {
					logger.Debug("Periodic organisation sync from DB to Redis completed successfully")
				}
			}
		}
	}(ctx, appService)

	// Periodically sync devices from Redis to in-memory map every 20 seconds.
	go func(ctx context.Context, ds *services.Service) {
		ticker := time.NewTicker(20 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				logger.Info("Redis→Var device sync goroutine exiting")
				return
			case <-ticker.C:
				if err := ds.SyncDevicesFromRedisToVar(); err != nil {
					logger.Error("Periodic device sync from Redis to in-memory variable failed", zap.Error(err))
				} else {
					logger.Debug("Periodic device sync from Redis to in-memory variable completed successfully")
				}

				if err := ds.SyncOrganisationsFromRedisToVar(); err != nil {
					logger.Error("Periodic organisation sync from Redis to in-memory variable failed", zap.Error(err))
				} else {
					logger.Debug("Periodic organisation sync from Redis to in-memory variable completed successfully")
				}
			}
		}
	}(ctx, appService)

}
