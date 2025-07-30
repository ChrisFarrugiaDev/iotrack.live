package main

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
	"iotrack.live/internal/cache"
	"iotrack.live/internal/db"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/models"
)

// ---------------------------------------------------------------------

// loadEnv loads environment variables from a .env file if not running in Docker.
var envPath = "./"

func loadEnv() error {

	os.Setenv("TZ", "UTC")

	// Check for DOCKERIZED (set as env in Docker Compose)
	if os.Getenv("DOCKERIZED") == "true" {
		// In Docker, assume envs are passed by Docker and skip loading .env files.
		return nil
	}

	env := os.Getenv("GO_ENV")
	var filename string

	switch env {
	case "production":
		filename = ".env"
	default:
		filename = ".env.development"
	}

	fullPath := fmt.Sprintf("%s%s", envPath, filename)
	err := godotenv.Load(fullPath)
	if err != nil {
		fmt.Printf("[envConfig] WARNING: Env file does not exist at: %s\n", fullPath)
	}

	return err
}

// ---------------------------------------------------------------------

func initializeCache() {
	// Initialize a Redis connection pool
	redisPool, err := cache.CreateRedisPool()
	if err != nil {
		logger.Error("Failed to connect to Redis", zap.Error(err))
		os.Exit(1)
	}
	port, _ := strconv.Atoi(os.Getenv("REDIS_PORT"))
	logger.Info("Successfully connected to Redis", zap.Int("Port", port))

	app.Cache = cache.NewCache(redisPool, "parser.teltonika:")
}

// ---------------------------------------------------------------------

func initializeDatabase() {
	// Initialize database connection
	dbPool, err := db.OpenDB()
	if err != nil {
		logger.Error("Error connecting to the database", zap.Error(err))
		os.Exit(1)
	}

	// Assign the database connection to the app configuration
	app.DB = dbPool

	app.Models, err = models.New(dbPool)
	if err != nil {
		logger.Error("Error initializing models", zap.Error(err))
	}
}

// ---------------------------------------------------------------------
