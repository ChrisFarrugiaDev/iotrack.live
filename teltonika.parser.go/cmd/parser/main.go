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

	"iotrack.live/teltonika.parser.go/internal/appcore"
	"iotrack.live/teltonika.parser.go/internal/apptypes"
	"iotrack.live/teltonika.parser.go/internal/cache"
	"iotrack.live/teltonika.parser.go/internal/logger"
	"iotrack.live/teltonika.parser.go/internal/rabbitmq"
	"iotrack.live/teltonika.parser.go/internal/services"
	"iotrack.live/teltonika.parser.go/internal/tcp"
)

var app appcore.App

func initializeAppCore(app *appcore.App) { // (ref:002)
	// Generates a unique instance ID for this app run.
	app.UUID = uuid7.New()

	// Initializes the cron scheduler with second-level precision.
	app.Cron = cron.New(cron.WithSeconds())

	// Holds the set of device IDs updated since the last telemetry flush.
	app.UpdatedDevices = make(map[int64]struct{})

	// Protects access to the latest telemetry data.
	app.LatestTelemetryLock = sync.Mutex{}

	// Stores the latest telemetry record for each device ID.
	app.LastTelemetryMap = make(map[int64]apptypes.FlatAvlRecord)

	// Stores the timestamp of the latest telemetry record for each device ID.
	app.LastTsMap = make(map[int64]time.Time)
}

func main() {

	// -----------------------------------------------------------------
	initializeAppCore(&app)

	loadEnv()

	logger.InitLogger() // (ref:004)

	initializeCache()

	// -----------------------------------------------------------------

	rabbitConfig, err := rabbitmq.LoadRabbitMQConfig("./rabbitmq_config.json")

	if err != nil {
		logger.Error("Failed to load RabbitMQ configuration file", zap.String("path", "./rabbitmq_config.json"), zap.Error(err))
		os.Exit(1)
	}

	// Start the message producer routine (ref:006)
	app.MQProducer = rabbitmq.NewRabbitMQProducer(rabbitConfig)
	go app.MQProducer.Run()

	// -----------------------------------------------------------------

	// Initialize database connection
	initializeDatabase()

	// -----------------------------------------------------------------

	// Initialize Redis publisher (async pub/sub). (ref:008)
	ch, stopPublisher := cache.StartPublisher(app.Cache, 2000)
	app.PubCh = ch

	// -----------------------------------------------------------------

	// Create a context that will be cancelled when an interrupt or termination signal is received. (ref:009)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)

	// stop() will stop the context from listening for further OS signals
	defer stop()

	serverClosed := make(chan struct{})

	// -----------------------------------------------------------------
	// Initialize Service with a pointer to your main app struct.
	appService := services.NewService(&app)

	// -----------------------------------------------------------------
	// Start device/organisation sync service routines (ref:010)
	startSyncRoutines(ctx, appService)

	// -----------------------------------------------------------------
	// Setup all scheduled cron jobs (ref:011)
	setupCrons(&app, appService)

	// -----------------------------------------------------------------

	// Start the TCP server in a new goroutine so main can keep control. (ref:012)
	go func() {
		tcpServer := tcp.NewTCPServer(&app, appService)
		tcpServer.Start(ctx)
		close(serverClosed) // Signal that the server has shut down.
	}()

	// -----------------------------------------------------------------

	// Block main goroutine until context is cancelled by an OS signal (e.g. CTRL+C). (ref:013)
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

	stopPublisher()

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
