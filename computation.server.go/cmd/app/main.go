package main

import (
	"encoding/json"
	"fmt"
	"os"

	"go.uber.org/zap"
	"iotrack.live/computation.server.go/internal/appcore"
	"iotrack.live/computation.server.go/internal/db"
	"iotrack.live/computation.server.go/internal/logger"
	"iotrack.live/computation.server.go/internal/models"
)

var app appcore.App

func main() {

	// Load ENV
	loadEnv()

	// Setup Logger
	logger.InitLogger()

	// Setup DB pools
	db, err := db.OpenDB()
	if err != nil {
		logger.Error("Error connection to the database", zap.Error(err))
		os.Exit(1)
	}
	app.DB = db

	// Setup Models
	m, err := models.New(db)
	app.Models = m

	test, err := app.Models.Telemetry.GetByID(7001786)

	if err != nil {
		fmt.Println(err)
	}

	b, _ := json.MarshalIndent(test, "", "  ")
	fmt.Println(string(b))

}
