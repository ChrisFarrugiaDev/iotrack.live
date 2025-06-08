package main

import (
	"os"

	"github.com/joho/godotenv"
)

func initializeAppSettings() {
	loadEnv()
}

func loadEnv() error {
	env := os.Getenv("GO_ENV")

	switch env {
	case "production":
		godotenv.Load(".env")
	default:
		godotenv.Load(".env.development") // Load development environment
	}

	return nil
}
