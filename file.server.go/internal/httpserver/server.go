package httpserver

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"
	routes "iotrack.live/file.server.go/internal/api/routers"
	"iotrack.live/file.server.go/internal/appcore"
	"iotrack.live/file.server.go/internal/logger"
)

type Server struct {
	HTTPServer *http.Server
	Port       string
	App        *appcore.App
	CloseCn    chan struct{}
}

func NewHttpServer(app *appcore.App, port string, httpClosedCh chan struct{}) *Server {
	mux := http.NewServeMux()
	mux.Handle("/", routes.Router())

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return &Server{
		HTTPServer: srv,
		Port:       port,
		App:        app,
		CloseCn:    httpClosedCh,
	}
}

func (s *Server) Start(ctx context.Context) {

	go func() {

		logger.Info("HTTP server is listening", zap.String("Port", s.Port))

		err := s.HTTPServer.ListenAndServe()

		if err != nil && err != http.ErrServerClosed {
			logger.Error("HTTP server error", zap.Error(err))
		}
	}()

	<-ctx.Done()
	logger.Info("HTTP server - Shutdown signal received")

	// We create a new context with a 5s timeout to allow a graceful shutdown.
	// Using only the parent ctx would fail because it is already cancelled
	// once a termination signal is received, causing Shutdown() to abort immediately.
	// With this timeout, the server stops taking new requests but gives ongoing
	// requests a short grace period to complete before forcing the shutdown.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := s.HTTPServer.Shutdown(shutdownCtx)

	if err != nil {
		logger.Error("HTTP server - graceful shutdown failed, forcing close", zap.Error(err))
		_ = s.HTTPServer.Close()

	} else {
		logger.Info("HTTP server - stopped gracefully")
	}

	close(s.CloseCn) // <- signal to main that we're done
}
