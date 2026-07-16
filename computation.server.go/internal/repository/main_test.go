package repository

import (
	"os"
	"testing"

	"iotrack.live/computation.server.go/internal/logger"
)

// TestMain initializes the global logger before any test in this package
// runs, same reason as internal/api/middlewares/main_test.go: logger.Log is
// nil until main.go calls InitLogger, and a nil *zap.Logger panics on use.
func TestMain(m *testing.M) {
	os.Setenv("LOG_MODE", "off")
	logger.InitLogger()
	os.Exit(m.Run())
}
