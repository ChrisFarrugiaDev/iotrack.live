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

	// A confirmed stop with activity on becomes active_static after this
	// long (§14.3); with activity off/unknown it becomes stationary after
	// JourneyEndSeconds (§14.4, §36.2 G).
	StaticConfirmationSeconds int
	JourneyEndSeconds         int

	// Elapsed time between points that means a data gap (§14.7). The dev
	// fleet's median cadence is 70s (ROADMAP Phase 3 ground truth), so 300
	// sits comfortably above normal reporting.
	MaximumPointGapSeconds int

	// Speeds above this are treated as GPS glitches, not driving (§40).
	MaximumPlausibleSpeedKph float64
}

// VehicleConfig is the §40 starting profile for vehicle trackers. The
// design doc marks these values "starting values only" — tune against real
// telemetry, in code, with the change recorded in the roadmap.
func VehicleConfig() JourneyConfig {
	return JourneyConfig{
		MovingSpeedKph:             5,
		MinimumMovementMeters:      25,
		MovementConfirmationPoints: 2,
		MovementConfirmationMeters: 50,
		StaticConfirmationSeconds:  120,
		JourneyEndSeconds:          180,
		MaximumPointGapSeconds:     300,
		MaximumPlausibleSpeedKph:   220,
	}
}

// PersonalConfig is the §40 starting profile for personal trackers.
func PersonalConfig() JourneyConfig {
	return JourneyConfig{
		MovingSpeedKph:             2,
		MinimumMovementMeters:      20,
		MovementConfirmationPoints: 2,
		MovementConfirmationMeters: 40,
		StaticConfirmationSeconds:  600,
		JourneyEndSeconds:          600,
		MaximumPointGapSeconds:     900,
		MaximumPlausibleSpeedKph:   160,
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
