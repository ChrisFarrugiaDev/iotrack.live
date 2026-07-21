package report

import (
	"testing"
	"time"
)

// stationaryPoints generates points at a fixed location (no movement) every
// 10s, for the given duration, with the given activity signal. Used to
// exercise StationaryConfirmationSeconds without the polyline machinery
// scenario_test.go's track type needs.
func stationaryPoints(start time.Time, duration time.Duration, ignition *bool) []TelemetryPoint {
	loc := depot

	var pts []TelemetryPoint
	for ts := start; !ts.After(start.Add(duration)); ts = ts.Add(10 * time.Second) {
		pts = append(pts, TelemetryPoint{
			Timestamp:  ts,
			Latitude:   loc[0],
			Longitude:  loc[1],
			SpeedKph:   f64(0),
			IgnitionOn: ignition,
			GPSValid:   true,
		})
	}
	return pts
}

// TestStationaryConfirmationSecondsUsesConfiguredWindow pins Phase 5's
// unification: StaticConfirmationSeconds and JourneyEndSeconds collapsed
// into one field, and both the active_static and stationary branches of
// stepStationary must read it — not a hardcoded value from before the
// merge.
func TestStationaryConfirmationSecondsUsesConfiguredWindow(t *testing.T) {
	start := time.Date(2026, 7, 20, 8, 0, 0, 0, time.UTC)
	off := false
	on := true

	t.Run("stationary confirms within the default vehicle window", func(t *testing.T) {
		cfg := VehicleConfig() // StationaryConfirmationSeconds: 180
		pts := stationaryPoints(start, 400*time.Second, &off)

		segments := BuildSegments(pts, cfg, start, start.Add(400*time.Second))

		found := false
		for _, s := range segments {
			if _, ok := s.(StationarySegment); ok {
				found = true
			}
		}
		if !found {
			t.Fatalf("want a stationary segment within 400s at the 180s default, got %#v", segments)
		}
	})

	t.Run("stationary never confirms once the window exceeds the point span", func(t *testing.T) {
		cfg := VehicleConfig()
		cfg.StationaryConfirmationSeconds = 600 // longer than the 400s of points below
		pts := stationaryPoints(start, 400*time.Second, &off)

		segments := BuildSegments(pts, cfg, start, start.Add(400*time.Second))

		for _, s := range segments {
			if _, ok := s.(StationarySegment); ok {
				t.Fatalf("want no stationary segment when the window (600s) exceeds the stop's span (400s), got %#v", segments)
			}
		}
	})

	t.Run("active_static reads the same field as stationary", func(t *testing.T) {
		cfg := VehicleConfig()
		pts := stationaryPoints(start, 400*time.Second, &on)

		segments := BuildSegments(pts, cfg, start, start.Add(400*time.Second))

		found := false
		for _, s := range segments {
			if _, ok := s.(ActiveStaticSegment); ok {
				found = true
			}
		}
		if !found {
			t.Fatalf("want an active_static segment within 400s at the 180s default, got %#v", segments)
		}
	})

	t.Run("active_static also never confirms once the window exceeds the point span", func(t *testing.T) {
		cfg := VehicleConfig()
		cfg.StationaryConfirmationSeconds = 600
		pts := stationaryPoints(start, 400*time.Second, &on)

		segments := BuildSegments(pts, cfg, start, start.Add(400*time.Second))

		for _, s := range segments {
			if _, ok := s.(ActiveStaticSegment); ok {
				t.Fatalf("want no active_static segment when the window (600s) exceeds the stop's span (400s), got %#v", segments)
			}
		}
	})
}
