package routers

import (
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"iotrack.live/computation.server.go/internal/api/handlers"
	"iotrack.live/computation.server.go/internal/appcore"
)

// Router builds the root router. Everything is mounted under /compute so the
// paths are identical bare and behind the Apache /compute/ proxy prefix.
func Router(app *appcore.App) chi.Router {
	mux := chi.NewRouter()

	mux.Use(chiMiddleware.Recoverer)
	mux.Use(chiMiddleware.RequestID)

	mux.Use(cors.Handler(cors.Options{
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
		AllowedOrigins:   []string{"https://*", "http://*"},
	}))

	mux.Route("/compute", func(r chi.Router) {
		r.Get("/health", handlers.Health)

		// Section sub-routers mount here: later /alarms, /audit.
		r.Mount("/reports", ReportRouter(app))
	})

	return mux
}
