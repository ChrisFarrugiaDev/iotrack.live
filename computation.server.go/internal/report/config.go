package report

// JourneyConfig holds the §40 segmentation thresholds. Values live in code,
// per tracker category; individual values get promoted to env vars only if
// real-world tuning demands it (SPEC, Configuration) — never pre-emptively.
type JourneyConfig struct {
	// A point is "moving" at or above this speed (§12).
	MovingSpeedKph float64
	// ...or when it moved at least this far from the previous point (§12).
	MinimumMovementMeters float64

	// Movement is CONFIRMED — a journey may start — after this many
	// consecutive moving points, or this much buffered movement (§13).
	// A journey must never start from one isolated noisy point.
	MovementConfirmationPoints int
	MovementConfirmationMeters float64

	// A confirmed stop becomes active_static (activity on) or stationary
	// (activity off/unknown) after this long (§14.3, §14.4, §36.2 G).
	// One shared window for both — unified 2026-07-20 (Phase 5) from two
	// separate fields; user-adjustable per request, 180-900s
	// (services.ActivityReportRequest.StationaryWindowSeconds).
	StationaryConfirmationSeconds int

	// Elapsed time between points that means a data gap (§14.7). The dev
	// fleet's median cadence is 70s (ROADMAP Phase 3 ground truth), so 300
	// sits comfortably above normal reporting.
	MaximumPointGapSeconds int

	// Speeds above this are treated as GPS glitches, not driving — a second,
	// independent data_gap trigger (§14.8). Same value for both profiles: a
	// journey-mode concept, not an asset-type one (every personal-profile
	// report is journey mode until §4.3's auto/cadence mode-switch exists).
	MaximumPlausibleSpeedKph float64
}

// VehicleConfig is the §40 starting profile for vehicle trackers. The
// design doc marks these values "starting values only" — tune against real
// telemetry, in code, with the change recorded in the roadmap.
func VehicleConfig() JourneyConfig {
	return JourneyConfig{
		MovingSpeedKph:                5,
		MinimumMovementMeters:         25,
		MovementConfirmationPoints:    2,
		MovementConfirmationMeters:    50,
		StationaryConfirmationSeconds: 180,
		MaximumPointGapSeconds:        300,
		MaximumPlausibleSpeedKph:      250,
	}
}

// PersonalConfig is the §40 starting profile for personal trackers.
func PersonalConfig() JourneyConfig {
	return JourneyConfig{
		MovingSpeedKph:                2,
		MinimumMovementMeters:         20,
		MovementConfirmationPoints:    2,
		MovementConfirmationMeters:    40,
		StationaryConfirmationSeconds: 600,
		MaximumPointGapSeconds:        900,
		MaximumPlausibleSpeedKph:      250,
	}
}

// ConfigFor picks the profile for an asset type. Assets ("asset" trackers)
// get the vehicle profile for now — they are served in journey mode until
// timeline mode exists (SPEC, pinned response), and unknown types default
// to vehicle, consistent with the range-limit default.
func ConfigFor(assetType *string) JourneyConfig {
	if assetType != nil && *assetType == "personal" {
		return PersonalConfig()
	}
	return VehicleConfig()
}
