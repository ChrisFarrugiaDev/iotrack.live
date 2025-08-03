package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/GoWebProd/uuid7"
	"github.com/robfig/cron/v3"
	"go.uber.org/zap"

	"iotrack.live/internal/appcore"
	"iotrack.live/internal/apptypes"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/rabbitmq"
	"iotrack.live/internal/services"
	"iotrack.live/internal/tcp"
)

var app appcore.App

func initializeAppCore(app *appcore.App) {
	app.UUID = uuid7.New()
	app.LastTelemetryMap = make(map[string]apptypes.FlatAvlRecord)
	app.UpdatedDevicesSetA = make(map[string]struct{})
	app.UpdatedDevicesSetB = make(map[string]struct{})
	app.ActiveList = "A"
	app.LatestTelemetryLock = sync.Mutex{}
	app.Cron = cron.New(cron.WithSeconds())
}

func main() {

	// -----------------------------------------------------------------
	initializeAppCore(&app)

	loadEnv()
	logger.InitLogger()
	initializeCache()

	// -----------------------------------------------------------------

	rabbitConfig, err := rabbitmq.LoadRabbitMQConfig("./rabbitmq_config.json")
	if err != nil {
		logger.Error("Failed to load RabbitMQ configuration file", zap.String("path", "./rabbitmq_config.json"), zap.Error(err))
		os.Exit(1)
	}

	// Start the message producer routine
	app.MQProducer = rabbitmq.NewRabbitMQProducer(rabbitConfig)
	go app.MQProducer.Run()

	// -----------------------------------------------------------------

	// Initialize database connection
	initializeDatabase()

	// -----------------------------------------------------------------

	// Create a context that will be cancelled when an interrupt or termination signal is received.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)

	// stop() will stop the context from listening for further OS signals
	defer stop()

	serverClosed := make(chan struct{})

	// -----------------------------------------------------------------
	// Initialize Service with a pointer to your main app struct.
	appService := services.NewService(&app)

	// -----------------------------------------------------------------
	// Start device sync service routines
	startDeviceSyncRoutines(ctx, appService)

	// -----------------------------------------------------------------
	// Setup all scheduled cron jobs
	setupCrons(&app, appService)

	// -----------------------------------------------------------------

	// Start the TCP server in a new goroutine so main can keep control.
	go func() {
		tcpServer := tcp.NewTCPServer(&app, appService)
		tcpServer.Start(ctx)
		close(serverClosed) // Signal that the server has shut down.
	}()

	// -----------------------------------------------------------------

	// Block main goroutine until context is cancelled by an OS signal (e.g. CTRL+C).
	// This keeps the main function alive while the TCP server runs in the background.
	<-ctx.Done()

	// -----------------------------------------------------------------
	// Gracefully shutdown

	// Close Tcp Server
	logger.Log.Info("Shutdown signal received, attempting graceful shutdown...")
	select {
	case <-serverClosed:
		logger.Log.Info("TCP server has shut down cleanly.")
	case <-time.After(5 * time.Second):
		logger.Log.Warn("TCP server shutdown timeout - forcing exit.")
	}

	// Close Redis
	if app.Cache != nil {
		err := app.Cache.Close()
		if err != nil {
			logger.Log.Warn("Failed to close Redis connection pool", zap.Error(err))
		} else {
			logger.Log.Info("Redis connection pool closed gracefully.")
		}
	}

	// Close RabbitMQ
	if app.MQProducer != nil {
		app.MQProducer.Close()
	}

	// Close DB
	if app.DB != nil {
		app.DB.Close()
		logger.Log.Info("Database connection pool closed gracefully.")
	}

	// Stop cron scheduler and wait for running jobs to finish
	if app.Cron != nil {
		ctx := app.Cron.Stop()
		<-ctx.Done()
		logger.Log.Info("Cron jobs stopped gracefully.")
	}

	// Ensure logs are flushed on exit
	if err := logger.Log.Sync(); err != nil && !isInvalidSyncError(err) {
		fmt.Fprintf(os.Stderr, "Logger sync failed: %v\n", err)
	}

}

// isInvalidSyncError returns true if the error is the harmless
// "invalid argument" sync error for /dev/stderr (common in dev)
func isInvalidSyncError(err error) bool {
	return strings.Contains(err.Error(), "invalid argument") && strings.Contains(err.Error(), "/dev/stderr")
}

// startDeviceSyncRoutines runs initial device syncs and launches periodic sync goroutine
func startDeviceSyncRoutines(ctx context.Context, appService *services.Service) {

	// Initial sync at startup: DB -> Redis
	if err := appService.SyncDevicesFromDBToRedis(); err != nil {
		logger.Error("Initial device sync from DB to Redis failed", zap.Error(err))
	}

	// Initial sync at startup: Redis -> in-memory map
	if err := appService.SyncDevicesFromRedisToVar(); err != nil {
		logger.Error("Initial device sync from Redis to in-memory variable failed", zap.Error(err))
	}

	// Periodically sync devices from DB to Redis every 5 minutes.
	go func(ctx context.Context, ds *services.Service) {
		ticker := time.NewTicker(5 * time.Minute)
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
			}
		}
	}(ctx, appService)

}
