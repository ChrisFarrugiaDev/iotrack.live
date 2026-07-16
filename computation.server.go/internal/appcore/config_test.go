package appcore

import (
	"os"
	"testing"

	"iotrack.live/computation.server.go/internal/logger"
)

// TestMain initializes the global logger before any test in this package
// runs (LoadConfig warns on bad values), same reason as the other packages'
// main_test.go files: logger.Log is nil until main.go calls InitLogger.
func TestMain(m *testing.M) {
	os.Setenv("LOG_MODE", "off")
	logger.InitLogger()
	os.Exit(m.Run())
}

func TestLoadConfigDefaults(t *testing.T) {
	// t.Setenv guarantees restoration; empty means unset for envInt.
	for _, key := range []string{
		"REPORT_MAX_CONCURRENT",
		"REPORT_MAX_RANGE_DAYS_VEHICLE",
		"REPORT_MAX_RANGE_DAYS_PERSONAL",
		"REPORT_MAX_RANGE_DAYS_ASSET",
	} {
		t.Setenv(key, "")
	}

	c := LoadConfig()

	if c.ReportMaxConcurrent != 4 || c.MaxRangeDaysVehicle != 7 ||
		c.MaxRangeDaysPersonal != 14 || c.MaxRangeDaysAsset != 31 {
		t.Fatalf("defaults wrong: %+v", c)
	}
}

func TestLoadConfigOverridesAndBadValues(t *testing.T) {
	t.Setenv("REPORT_MAX_CONCURRENT", "8")            // valid override
	t.Setenv("REPORT_MAX_RANGE_DAYS_VEHICLE", "abc")  // unparseable -> default
	t.Setenv("REPORT_MAX_RANGE_DAYS_PERSONAL", "-3")  // not positive -> default
	t.Setenv("REPORT_MAX_RANGE_DAYS_ASSET", "90")     // valid override

	c := LoadConfig()

	if c.ReportMaxConcurrent != 8 {
		t.Fatalf("ReportMaxConcurrent = %d, want 8", c.ReportMaxConcurrent)
	}
	if c.MaxRangeDaysVehicle != 7 {
		t.Fatalf("MaxRangeDaysVehicle = %d, want default 7 for unparseable value", c.MaxRangeDaysVehicle)
	}
	if c.MaxRangeDaysPersonal != 14 {
		t.Fatalf("MaxRangeDaysPersonal = %d, want default 14 for negative value", c.MaxRangeDaysPersonal)
	}
	if c.MaxRangeDaysAsset != 90 {
		t.Fatalf("MaxRangeDaysAsset = %d, want 90", c.MaxRangeDaysAsset)
	}
}

func TestMaxRangeDaysFor(t *testing.T) {
	c := Config{MaxRangeDaysVehicle: 7, MaxRangeDaysPersonal: 14, MaxRangeDaysAsset: 31}

	str := func(s string) *string { return &s }

	cases := []struct {
		name      string
		assetType *string
		want      int
	}{
		{"vehicle", str("vehicle"), 7},
		{"personal", str("personal"), 14},
		{"asset", str("asset"), 31},
		{"nil type gets strictest", nil, 7},
		{"unknown type gets strictest", str("drone"), 7},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := c.MaxRangeDaysFor(tc.assetType); got != tc.want {
				t.Fatalf("MaxRangeDaysFor(%v) = %d, want %d", tc.assetType, got, tc.want)
			}
		})
	}
}
