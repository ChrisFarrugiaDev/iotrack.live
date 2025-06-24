package main

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
	"iotrack.live/internal/cache"
	"iotrack.live/internal/logger"
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
	logger.Info("Successfully connected to Redis")

	app.Cache = cache.NewCache(redisPool, os.Getenv("REDIS_PREFIX"))
}

// ---------------------------------------------------------------------
