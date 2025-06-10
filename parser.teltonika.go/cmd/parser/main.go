package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"iotrack.live/internal/logger"
	"iotrack.live/internal/tcp"
)

func main() {
	initializeAppSettings()

	logger.InitLogger()
	defer logger.Log.Sync() // Ensure logs are flushed on exit

	// Create a context that will be cancelled when an interrupt or termination signal is received.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	serverClosed := make(chan struct{})

	// Start the TCP server in a new goroutine so main can keep control.
	go func() {
		tcp.StartServer(ctx)
		close(serverClosed) // Signal that the server has shut down.
	}()

	// Block main goroutine until context is cancelled by an OS signal (e.g. CTRL+C).
	// This keeps the main function alive while the TCP server runs in the background.
	<-ctx.Done()

	logger.Log.Info("Shutdown signal received, attempting graceful shutdown...")
	select {
	case <-serverClosed:
		logger.Log.Info("TCP server has shut down cleanly.")
	case <-time.After(5 * time.Second):
		logger.Log.Warn("TCP server shutdown timeout – forcing exit.")
	}
}
