package main

import (
	"iotrack.live/internal/logger"
	"iotrack.live/internal/tcp"
)

func main() {

	initializeAppSettings()

	logger.InitLogger()
	defer logger.Log.Sync() // flushes buffer

	tcp.StartServer()

}
