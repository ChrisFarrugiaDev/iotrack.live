// Package report is the pure computation core of the service: normalised
// telemetry in, segments and summaries out.
//
// Purity rule — no HTTP, no SQL, no logger, no clocks beyond the data
// itself. The only internal import allowed is internal/models (bare
// structs). This is what lets the §36.2 fixtures test the engine directly,
// with no database or server behind the tests.
package report

import "time"

// TelemetryPoint is the §10 normalised point — the one shape everything
// downstream of the normaliser consumes, and (for now) the point shape the
// response serves. Its JSON satisfies the frontend's §18 ReportPoint
// contract; movementDetected and gpsValid are additive extras.
//
// The rules this struct encodes are pinned in SPEC.md ("TelemetryPoint —
// pinned"): pointers for every null-able signal because nil marshals to
// JSON null and unknown is never collapsed to false or 0 (§41.4); id is a
// string because BIGSERIAL can pass JavaScript's 2^53 (§18); Timestamp is
// happened_at, the authoritative UTC column, never the payload's epoch
// string; invalid coordinates mark GPSValid=false but the point is kept —
// dropping is the engine's §13 decision, not the normaliser's.
type TelemetryPoint struct {
	ID        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`

	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`

	SpeedKph *float64 `json:"speedKph"` // nil = vendor didn't report it, never 0
	Heading  *float64 `json:"heading"`  // device angle; the engine prefers course over ground (§41)
	Altitude *float64 `json:"altitude"`

	IgnitionOn       *bool `json:"ignitionOn"`       // element 239: number 0/1 → false/true; absent → nil
	ActivityOn       *bool `json:"activityOn"`       // provisional: digital_input_1; per-asset config later
	MovementDetected *bool `json:"movementDetected"` // element 240
	GPSValid         bool  `json:"gpsValid"`

	// Parameters carries the remaining IO elements under the parser's names
	// (ioelements.go); unknown ids keep their numeric key. ibutton and rfid
	// values are always strings end to end — as JSON numbers their 18 digits
	// corrupt past 2^53 in every browser.
	Parameters map[string]any `json:"parameters,omitempty"`
}

// ActivitySource names which signal decided a point's activity state, in
// §11 priority order. Values match the frontend contract
// (web.frontend.vue/src/types/activity-report.type.ts).
type ActivitySource string

const (
	SourceIgnition       ActivitySource = "ignition"
	SourcePTO            ActivitySource = "pto"
	SourceEngine         ActivitySource = "engine"
	SourceDigitalInput   ActivitySource = "digital_input"
	SourceDeviceActivity ActivitySource = "device_activity"
	SourceUnknown        ActivitySource = "unknown"
)
