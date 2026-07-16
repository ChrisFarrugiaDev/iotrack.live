package services

import (
	"os"
	"testing"

	"iotrack.live/computation.server.go/internal/logger"
)

// TestMain initializes the global logger before any test in this package
// runs, same reason as the other packages' main_test.go files: logger.Log
// is nil until main.go calls InitLogger.
func TestMain(m *testing.M) {
	os.Setenv("LOG_MODE", "off")
	logger.InitLogger()
	os.Exit(m.Run())
}
