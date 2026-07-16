package appcore

import (
	"os"
	"strconv"

	"go.uber.org/zap"

	"iotrack.live/computation.server.go/internal/logger"
)

// Config holds the report limits from the SPEC's Configuration table,
// parsed once at boot. Thresholds inside the segmentation engine
// (JourneyConfig, §40) are NOT here — those stay in internal/report and
// only get promoted to env vars if real-world tuning demands it.
type Config struct {
	// Simultaneous report computations; waiters queue, they don't fail.
	ReportMaxConcurrent int

	// Maximum report range in days, per tracker category (§30).
	MaxRangeDaysVehicle  int
	MaxRangeDaysPersonal int
	MaxRangeDaysAsset    int
}

// LoadConfig reads the report limits from the environment. A missing or
// unparseable value falls back to its default with a warning — a bad limit
// should never stop the service from booting.
func LoadConfig() Config {
	return Config{
		ReportMaxConcurrent:  envInt("REPORT_MAX_CONCURRENT", 4),
		MaxRangeDaysVehicle:  envInt("REPORT_MAX_RANGE_DAYS_VEHICLE", 7),
		MaxRangeDaysPersonal: envInt("REPORT_MAX_RANGE_DAYS_PERSONAL", 14),
		MaxRangeDaysAsset:    envInt("REPORT_MAX_RANGE_DAYS_ASSET", 31),
	}
}

// MaxRangeDaysFor returns the range limit for an asset's type. Unknown or
// missing types get the vehicle limit — the strictest — so a new tracker
// category can never accidentally allow a wider range than any known one.
func (c Config) MaxRangeDaysFor(assetType *string) int {
	if assetType == nil {
		return c.MaxRangeDaysVehicle
	}

	switch *assetType {
	case "personal":
		return c.MaxRangeDaysPersonal
	case "asset":
		return c.MaxRangeDaysAsset
	default: // "vehicle" and anything unrecognised
		return c.MaxRangeDaysVehicle
	}
}

// envInt reads an env var as a positive integer, falling back to def when
// unset, unparseable, or not positive.
func envInt(key string, def int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return def
	}

	v, err := strconv.Atoi(raw)
	if err != nil || v <= 0 {
		logger.Warn("invalid config value, using default",
			zap.String("key", key), zap.String("value", raw), zap.Int("default", def))
		return def
	}

	return v
}
