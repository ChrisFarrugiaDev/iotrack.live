package main

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

var envPath = ""

func loadEnv() error {

	os.Setenv("TZ", "UTC")

	// Check for DOCKERIZED (set as env in Docker Compose)
	if os.Getenv("DOCKERIZED") == "true" {

		return nil
	}

	env := os.Getenv("GO_ENV")

	filename := ".env.development"

	if env == "production" {
		filename = ".env"
	}

	fullPath := fmt.Sprintf("%s%s", envPath, filename)
	err := godotenv.Load(fullPath)
	if err != nil {
		fmt.Printf("[envConfig] WARNING: Env file does not exist at: %s\n", fullPath)
	}

	return nil
}
