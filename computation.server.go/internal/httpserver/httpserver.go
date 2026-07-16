package httpserver

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"

	"iotrack.live/computation.server.go/internal/api/routers"
	"iotrack.live/computation.server.go/internal/appcore"
	"iotrack.live/computation.server.go/internal/logger"
)

type Server struct {
	HTTPServer *http.Server
	Port       string
	CloseCn    chan struct{}
}

func NewHttpServer(app *appcore.App, port string, httpClosedCh chan struct{}) *Server {
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", port),
		Handler: routers.Router(app),
		// Reports can take a while to compute; the write timeout must
		// outlive the longest acceptable report generation.
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return &Server{
		HTTPServer: srv,
		Port:       port,
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

	// The parent ctx is already cancelled here, so Shutdown needs its own
	// timeout context: stop taking new requests, give in-flight ones a short
	// grace period to finish.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.HTTPServer.Shutdown(shutdownCtx); err != nil {
		logger.Error("HTTP server - graceful shutdown failed, forcing close", zap.Error(err))
		_ = s.HTTPServer.Close()
	} else {
		logger.Info("HTTP server - stopped gracefully")
	}

	close(s.CloseCn) // signal to main that we're done
}
