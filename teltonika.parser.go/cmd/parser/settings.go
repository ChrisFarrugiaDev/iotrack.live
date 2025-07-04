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

var envPath = "./"

func loadEnv() error {
	env := os.Getenv("GO_ENV")
	var err error

	switch env {
	case "production":
		err = godotenv.Load(fmt.Sprintf("%s.env", envPath))
	default:
		err = godotenv.Load(fmt.Sprintf("%s.env.development", envPath)) // Load development environment

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

	app.Cache = cache.NewCache(redisPool, os.Getenv("REDIS_PREFIX"))
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
