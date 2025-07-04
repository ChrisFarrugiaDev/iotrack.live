package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"
	"iotrack.live/internal/appcore"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/rabbitmq"
	"iotrack.live/internal/tcp"
)

var app appcore.App

func main() {

	loadEnv()

	app.Log = logger.InitLogger()

	initializeCache()

	rabbitConfig, err := rabbitmq.LoadRabbitMQConfig("./rabbitmq_config.json")
	if err != nil {
		logger.Error("Failed to load RabbitMQ configuration file", zap.String("path", "./rabbitmq_config.json"), zap.Error(err))
		os.Exit(1)
	}

	// Initialize database connection
	initializeDatabase()

	// Start the message producer routine
	app.MQProducer = rabbitmq.NewRabbitMQProducer(rabbitConfig)
	go app.MQProducer.Run()

	// Create a context that will be cancelled when an interrupt or termination signal is received.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	serverClosed := make(chan struct{})

	// Start the TCP server in a new goroutine so main can keep control.
	go func() {
		tcpServer := tcp.NewTCPServer(&app)
		tcpServer.Start(ctx)
		close(serverClosed) // Signal that the server has shut down.
	}()

	// Block main goroutine until context is cancelled by an OS signal (e.g. CTRL+C).
	// This keeps the main function alive while the TCP server runs in the background.
	<-ctx.Done()

	// Gracefully close Tcp Server
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
