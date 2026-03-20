package main

import (
	"os"

	"go.uber.org/zap"
	"iotrack.live/computation.server.go/internal/appcore"
	"iotrack.live/computation.server.go/internal/db"
	"iotrack.live/computation.server.go/internal/logger"
)

var app appcore.App

func main() {

	// Load ENV
	loadEnv()

	// Create Logger
	logger.InitLogger()

	// init db

	db, err := db.OpenDB()
	if err != nil {
		logger.Error("Error connection to the database", zap.Error(err))
		os.Exit(1)
	}
	app.DB = db

	logger.Debug("Hello World!")
}
