package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"iotrack.live/file.server.go/internal/appcore"
	"iotrack.live/file.server.go/internal/httpserver"
	"iotrack.live/file.server.go/internal/logger"
)

var app appcore.App

func main() {
	// Init logging ASAP so any init problems are visible.
	logger.InitLogger()
	logger.Log.Info("Booting image server...")

	loadEnv()
	initializeAppCore()
	initializeDatabase()

	// -----------------------------------------------------------------

	// Create a context that will be cancelled when an interrupt or termination signal is received.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)

	// stop() will stop the context from listening for further OS signals
	defer stop()

	// Channel to know when HTTP server has fully shut down
	httpClosedCh := make(chan struct{})

	// Start HTTP server
	port := os.Getenv("HTTP_PORT")
	if port == "" {
		port = "4002"
	}
	srv := httpserver.NewHttpServer(&app, port, httpClosedCh)
	go srv.Start(ctx)

	// -----------------------------------------------------------------
	// Block main goroutine until context is cancelled by an OS signal (e.g. CTRL+C).
	// This keeps the main function alive while the TCP server runs in the background.

	<-ctx.Done()
	logger.Info("Shutdown signal received, beginning graceful shutdown...")

	// -----------------------------------------------------------------
	// Gracefully shutdown

	// Wait for the HTTP server to close, with a timeout.
	exitCode := 0
	select {
	case <-httpClosedCh:
		logger.Log.Info("HTTP server shut down cleanly.")
	case <-time.After(10 * time.Second):
		logger.Log.Warn("HTTP server shutdown timeout - exiting anyway.")
	}

	// Close DB
	if app.DB != nil {
		app.DB.Close()
		logger.Log.Info("Database connection pool closed gracefully.")
	}

	os.Exit(exitCode)
}
