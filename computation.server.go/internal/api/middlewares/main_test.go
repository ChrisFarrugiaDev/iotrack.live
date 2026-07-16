package middlewares

import (
	"os"
	"testing"

	"iotrack.live/computation.server.go/internal/logger"
)

// TestMain initializes the global logger before any test in this package
// runs. Without it, logger.Log is nil here — only main.go calls InitLogger,
// and RequirePermission logs on a repository error. Same pattern as
// teltonika.parser.go/internal/rabbitmq.
func TestMain(m *testing.M) {
	os.Setenv("LOG_MODE", "off")
	logger.InitLogger()
	os.Exit(m.Run())
}
