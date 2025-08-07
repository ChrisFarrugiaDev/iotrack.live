package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

// Load config from environment variables (fall back to defaults if not set)
var GO_APP_URL = getEnv("GO_APP_URL", "http://57.129.22.122")
var GO_APP_PORT = getEnv("GO_APP_PORT", "4000")
var GO_API_PORT = getEnv("GO_API_PORT", "4001")

// getEnv returns the value of the environment variable or a default if not set
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func main() {
	mux := http.NewServeMux()
	mux.Handle("/", Routes())

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", GO_APP_PORT),
		Handler: mux,
	}

	log.Printf("Starting server on %s", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
}
