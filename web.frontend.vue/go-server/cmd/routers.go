package main

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func Routes() http.Handler {
	mux := chi.NewRouter() // Create a new chi router

	// Recover from panics and return 500 errors instead of crashing the server
	mux.Use(middleware.Recoverer)

	// Enable CORS for all http(s) origins and basic methods/headers
	mux.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"https://*", "http://*"}, // Allow any origin (set to your domain in production)
		// AllowedOrigins: []string{"https://yourdomain.com"}, // Recommended for production
		AllowedMethods:   []string{"GET", "OPTIONS"},         // Only allow GET and OPTIONS requests
		AllowedHeaders:   []string{"Accept", "Content-Type"}, // Allow basic headers
		ExposedHeaders:   []string{},                         // No custom headers exposed
		AllowCredentials: false,                              // Don't allow credentials
		MaxAge:           300,                                // Cache CORS options for 5 minutes
	}))

	vueHandler := &VueHandler{} // Create your custom Vue handler

	// Serve index.html for the root route, can inject variables for the SPA
	mux.Get("/", vueHandler.ServerIndexWithVariables)
	mux.Get("/login", vueHandler.ServerIndexWithVariables)

	// Build absolute path to the 'dist' directory (Vue build output)
	workDir, _ := filepath.Abs(".")
	filesDir := filepath.Join(workDir, "dist")

	// Serve all static files from the 'dist' directory at the root path
	FileServer(mux, "/", http.Dir(filesDir))

	return mux // Return the router as an http.Handler
}

// FileServer sets up a http.FileServer handler to serve static files from a http.FileSystem.
func FileServer(r chi.Router, path string, root http.FileSystem) {
	// Prevent usage of URL parameters in the static file path for safety.
	if strings.ContainsAny(path, "{}*") {
		panic("FileServer does not permit URL parameters.")
	}

	// Create a file server handler that strips the path prefix before serving files.
	fs := http.StripPrefix(path, http.FileServer(root))

	// Register a GET route to serve static files matching the given path prefix.
	r.Get(path+"*", func(w http.ResponseWriter, r *http.Request) {
		fs.ServeHTTP(w, r) // Delegate request to the file server handler.
	})
}
