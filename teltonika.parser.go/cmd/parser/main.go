package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/GoWebProd/uuid7"
	"go.uber.org/zap"

	"iotrack.live/internal/appcore"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/rabbitmq"
	"iotrack.live/internal/services"
	"iotrack.live/internal/tcp"
)

var app appcore.App

func main() {

	// -----------------------------------------------------------------
	app.UUID = uuid7.New()
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
	// Start device sync service routines
	startDeviceSyncRoutines(ctx)
	// -----------------------------------------------------------------

	// Start the TCP server in a new goroutine so main can keep control.
	go func() {
		tcpServer := tcp.NewTCPServer(&app)
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

	// Ensure logs are flushed on exit
	if err := logger.Log.Sync(); err != nil {
		// Print to stderr as last resort
		fmt.Fprintf(os.Stderr, "Logger sync failed: %v\n", err)
	}

}

// startDeviceSyncRoutines runs initial device syncs and launches periodic sync goroutine
func startDeviceSyncRoutines(ctx context.Context) {

	// Initialize the DeviceService with a pointer to your main app struct.
	deviceService := services.DeviceService{App: &app}

	// Initial sync at startup: DB -> Redis
	if err := deviceService.SyncDevicesFromDBToRedis(); err != nil {
		logger.Error("Initial device sync from DB to Redis failed", zap.Error(err))
	}

	// Initial sync at startup: Redis -> in-memory map
	if err := deviceService.SyncDevicesFromRedisToVar(); err != nil {
		logger.Error("Initial device sync from Redis to in-memory variable failed", zap.Error(err))
	}

	// Periodically sync devices from DB to Redis every 5 minutes.
	go func(ctx context.Context, ds *services.DeviceService) {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				logger.Debug("DB→Redis device sync goroutine exiting")
				return
			case <-ticker.C:
				if err := ds.SyncDevicesFromDBToRedis(); err != nil {
					logger.Error("Periodic device sync from DB to Redis failed", zap.Error(err))
				} else {
					logger.Debug("Periodic device sync from DB to Redis completed successfully")
				}
			}
		}
	}(ctx, &deviceService)

	// Periodically sync devices from Redis to in-memory map every 20 seconds.
	go func(ctx context.Context, ds *services.DeviceService) {
		ticker := time.NewTicker(20 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				logger.Debug("Redis→Var device sync goroutine exiting")
				return
			case <-ticker.C:
				if err := ds.SyncDevicesFromRedisToVar(); err != nil {
					logger.Error("Periodic device sync from Redis to in-memory variable failed", zap.Error(err))
				} else {
					logger.Debug("Periodic device sync from Redis to in-memory variable completed successfully")
				}
			}
		}
	}(ctx, &deviceService)

}
