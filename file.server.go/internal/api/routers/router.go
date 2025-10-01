package routes

import (
	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func Router() chi.Router {
	mux := chi.NewRouter()

	// Middleware
	mux.Use(chiMiddleware.Recoverer)
	mux.Use(chiMiddleware.RequestID)

	mux.Use(cors.Handler(cors.Options{
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link", "ETag"},
		AllowCredentials: false,
		MaxAge:           300,
		AllowedOrigins:   []string{"https://*", "http://*"},

		// AllowOriginFunc: func(r *http.Request, origin string) bool {
		// 	// TODO: read allowed origins from config/env (comma-separated)
		// 	// Example: allow your site + local dev
		// 	return strings.HasSuffix(origin, ".iotrack.live") ||
		// 		origin == "https://iotrack.live" ||
		// 		origin == "http://localhost:5173"
		// },
	}))

	mux.Route("/", func(r chi.Router) {
		r.Mount("/img", ImageRouter())
	})

	return mux
}
