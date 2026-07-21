package report

import (
	"testing"
	"time"
)

// TestMovementFlagDoesNotOverrideKnownZeroSpeed is a scenario-level
// regression for the real bug found 2026-07-20 on AFO-544: MovementDetected
// mirrored ignition state (true for the whole time ignition was on,
// including 10+ minutes parked at speed=0), which used to keep isMoving
// returning true throughout an entire stationary, ignition-on period —
// fragmenting what should have been one active_static segment into a
// "journey" with near-zero speed and distance, and in one case a genuine
// two-point phantom journey lasting 3 seconds.
//
// This reproduces that exact shape: parked, ignition on, speed=0 for many
// consecutive points, MovementDetected=true throughout (as it genuinely was
// in the raw production data) — and confirms it now reads as one
// active_static segment, not a chain of phantom journeys.
func TestMovementFlagDoesNotOverrideKnownZeroSpeed(t *testing.T) {
	start := time.Date(2026, 7, 20, 8, 0, 0, 0, time.UTC)
	on := true
	detected := true

	var pts []TelemetryPoint
	for i := 0; i < 20; i++ {
		pts = append(pts, TelemetryPoint{
			Timestamp:        start.Add(time.Duration(i) * 10 * time.Second),
			Latitude:         mgarr[0],
			Longitude:        mgarr[1],
			SpeedKph:         f64(0),
			IgnitionOn:       &on,
			MovementDetected: &detected,
			GPSValid:         true,
		})
	}

	cfg := VehicleConfig()
	segments := BuildSegments(pts, cfg, start, pts[len(pts)-1].Timestamp)

	if len(segments) != 1 {
		t.Fatalf("want 1 segment (active_static), got %d: %#v", len(segments), segments)
	}
	if _, ok := segments[0].(ActiveStaticSegment); !ok {
		t.Fatalf("segment 0 = %T, want ActiveStaticSegment — a bare MovementDetected=true must not "+
			"override a present, known-zero speed reading and fragment this into a journey", segments[0])
	}
}
