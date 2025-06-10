package main

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

func initializeAppSettings() {
	loadEnv()
}

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
