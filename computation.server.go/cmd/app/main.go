package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"iotrack.live/computation.server.go/internal/appcore"
	"iotrack.live/computation.server.go/internal/db"
	"iotrack.live/computation.server.go/internal/httpserver"
	"iotrack.live/computation.server.go/internal/logger"
	"iotrack.live/computation.server.go/internal/repository"
)

var app appcore.App

func main() {
	// Init logging ASAP so any init problems are visible.
	logger.InitLogger()
	logger.Info("Booting computation server...")

	loadEnv()

	// Fail fast: with no secret the auth middleware could never verify a
	// token honestly.
	app.JWTSecret = []byte(os.Getenv("JWT_SECRET"))
	if len(app.JWTSecret) == 0 {
		logger.Error("JWT_SECRET is not set")
		os.Exit(1)
	}

	// Setup DB pool
	pool, err := db.OpenDB()
	if err != nil {
		logger.Error("Error connecting to the database", zap.Error(err))
		os.Exit(1)
	}
	app.DB = pool

	repo, err := repository.NewRepository(pool)
	if err != nil {
		logger.Error("Error building repositories", zap.Error(err))
		os.Exit(1)
	}
	app.Repo = repo

	// -----------------------------------------------------------------

	// Context cancelled on interrupt or termination signal.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Channel to know when the HTTP server has fully shut down.
	httpClosedCh := make(chan struct{})

	port := os.Getenv("HTTP_PORT")
	if port == "" {
		port = "4004"
	}
	srv := httpserver.NewHttpServer(&app, port, httpClosedCh)
	go srv.Start(ctx)

	// -----------------------------------------------------------------
	// Block until a shutdown signal arrives, then shut down gracefully.

	<-ctx.Done()
	logger.Info("Shutdown signal received, beginning graceful shutdown...")

	select {
	case <-httpClosedCh:
		logger.Info("HTTP server shut down cleanly.")
	case <-time.After(10 * time.Second):
		logger.Warn("HTTP server shutdown timeout - exiting anyway.")
	}

	if app.DB != nil {
		app.DB.Close()
		logger.Info("Database connection pool closed gracefully.")
	}
}
