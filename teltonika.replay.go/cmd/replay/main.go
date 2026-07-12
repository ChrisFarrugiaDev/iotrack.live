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

	"iotrack.live/teltonika.replay.go/internal/appcore"
	"iotrack.live/teltonika.replay.go/internal/apptypes"
	"iotrack.live/teltonika.replay.go/internal/cache"
	"iotrack.live/teltonika.replay.go/internal/logger"
	"iotrack.live/teltonika.replay.go/internal/rabbitmq"
	"iotrack.live/teltonika.replay.go/internal/replay"
	"iotrack.live/teltonika.replay.go/internal/services"
)

var app appcore.App

func initializeAppCore(app *appcore.App) {
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

	// Initialize Redis publisher (async pub/sub).
	ch, stopPublisher := cache.StartPublisher(app.Cache, 2000)
	app.PubCh = ch

	// -----------------------------------------------------------------

	// Create a context that will be cancelled when an interrupt or termination signal is received.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)

	// stop() will stop the context from listening for further OS signals
	defer stop()

	// -----------------------------------------------------------------
	// Initialize Service with a pointer to your main app struct.
	appService := services.NewService(&app)

	// -----------------------------------------------------------------
	// Start device/organisation sync service routines
	startSyncRoutines(ctx, appService)

	// -----------------------------------------------------------------
	// Setup all scheduled cron jobs
	setupCrons(&app, appService)

	// -----------------------------------------------------------------

	// Build the optional meta service (requires REPLAY_META=true and a DB).
	meta, err := loadMetaService(app.DB)
	if err != nil {
		logger.Error("Invalid replay meta configuration", zap.Error(err))
		os.Exit(1)
	}
	if meta != nil {
		if err := meta.EnsureSchema(ctx); err != nil {
			logger.Error("Failed to create replay_meta schema", zap.Error(err))
			os.Exit(1)
		}
	}

	// Start the replay loop: load REPLAY_START_FILE, replay each device's
	// Codec 8 packets on a wall-clock schedule, and rotate days at each UTC
	// midnight (§5-6). Everything is bound to ctx for clean shutdown.
	replayCfg, err := loadReplayConfig()
	if err != nil {
		logger.Error("Invalid replay configuration", zap.Error(err))
		os.Exit(1)
	}
	replayCfg.Meta = meta

	dryRun := strings.EqualFold(os.Getenv("REPLAY_DRY_RUN"), "true")
	if dryRun {
		logger.Log.Warn("REPLAY_DRY_RUN=true — no telemetry will be published; fired packets are logged only")
	}
	processor := replay.NewProcessor(&app, appService, os.Getenv("REPLAY_CRC_MODE"), dryRun)
	rotator, err := replay.NewRotator(replayCfg, processor)
	if err != nil {
		logger.Error("Failed to initialise replay rotator", zap.Error(err))
		os.Exit(1)
	}

	replayClosed := make(chan struct{})
	go func() {
		rotator.Run(ctx)
		close(replayClosed) // Signal that the replay loop has stopped.
	}()

	metaClosed := make(chan struct{})
	if meta != nil {
		go func() {
			meta.Run(ctx)
			close(metaClosed)
		}()
	} else {
		close(metaClosed)
	}

	// -----------------------------------------------------------------

	// Block main goroutine until context is cancelled by an OS signal (e.g. CTRL+C).
	<-ctx.Done()

	// -----------------------------------------------------------------
	// Gracefully shutdown

	logger.Log.Info("Shutdown signal received, attempting graceful shutdown...")

	// Wait for the replay loop (and its device goroutines) to stop.
	select {
	case <-replayClosed:
		logger.Log.Info("Replay loop stopped cleanly.")
	case <-time.After(5 * time.Second):
		logger.Log.Warn("Replay loop shutdown timeout - forcing exit.")
	}

	// Wait for the meta service to complete its final flush.
	select {
	case <-metaClosed:
		logger.Log.Info("Replay meta service stopped cleanly.")
	case <-time.After(10 * time.Second):
		logger.Log.Warn("Replay meta service shutdown timeout - forcing exit.")
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
