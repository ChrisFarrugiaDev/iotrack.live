package report

import (
	"math"
	"testing"
)

func pt(lat, lng float64) TelemetryPoint {
	return TelemetryPoint{Latitude: lat, Longitude: lng}
}

func f64(v float64) *float64 { return &v }
func b(v bool) *bool         { return &v }

func TestHaversineMeters(t *testing.T) {
	cases := []struct {
		name      string
		a, b      TelemetryPoint
		want      float64
		tolerance float64 // fraction
	}{
		{"same point", pt(35.9458, 14.3895), pt(35.9458, 14.3895), 0, 0},
		// 0.01° of latitude is ~1111.9m anywhere on Earth.
		{"hundredth degree latitude", pt(35.90, 14.50), pt(35.91, 14.50), 1111.9, 0.005},
		// Mosta to Valletta area (the fixture geography), roughly 8.9km.
		{"across Malta", pt(35.9092, 14.4258), pt(35.8989, 14.5146), 8300, 0.05},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := haversineMeters(tc.a, tc.b)
			if tc.want == 0 {
				if got != 0 {
					t.Fatalf("distance = %f, want exactly 0", got)
				}
				return
			}
			if math.Abs(got-tc.want)/tc.want > tc.tolerance {
				t.Fatalf("distance = %f, want %f (±%.1f%%)", got, tc.want, tc.tolerance*100)
			}
		})
	}
}

func TestIsMoving(t *testing.T) {
	cfg := VehicleConfig() // moving >= 5 km/h, distance >= 25m

	cases := []struct {
		name     string
		point    TelemetryPoint
		distance float64
		want     bool
	}{
		{"fast enough", TelemetryPoint{SpeedKph: f64(5)}, 0, true},
		{"too slow, no distance", TelemetryPoint{SpeedKph: f64(4.9)}, 0, false},
		{"slow but far enough", TelemetryPoint{SpeedKph: f64(0)}, 25, true},
		{"drift-scale distance is not movement", TelemetryPoint{SpeedKph: f64(0)}, 10, false},
		{"movement flag alone", TelemetryPoint{SpeedKph: f64(0), MovementDetected: b(true)}, 0, true},
		{"movement flag false", TelemetryPoint{SpeedKph: f64(0), MovementDetected: b(false)}, 0, false},
		// nil speed and nil flag: only distance can speak (§41.4 — nil is
		// not zero, but it grants nothing either).
		{"all signals unknown, small distance", TelemetryPoint{}, 10, false},
		{"all signals unknown, real distance", TelemetryPoint{}, 30, true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := isMoving(tc.point, tc.distance, cfg); got != tc.want {
				t.Fatalf("isMoving = %v, want %v", got, tc.want)
			}
		})
	}
}

func TestMovementConfirmed(t *testing.T) {
	cfg := VehicleConfig() // 2 consecutive points or 50m buffered

	cases := []struct {
		name   string
		points int
		meters float64
		want   bool
	}{
		{"one blip is never a journey", 1, 10, false},
		{"two consecutive moving points", 2, 10, true},
		{"one point but real distance", 1, 50, true},
		{"nothing buffered", 0, 0, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := movementConfirmed(tc.points, tc.meters, cfg); got != tc.want {
				t.Fatalf("movementConfirmed = %v, want %v", got, tc.want)
			}
		})
	}
}

// Scenario D's core (§36.2, §13): a parked vehicle whose fixes jitter
// randomly within 10 metres must never produce movement — not per point,
// and therefore never a confirmed journey start.
func TestGPSDriftNeverMoves(t *testing.T) {
	cfg := VehicleConfig()

	// A ring of fixes around one spot, each within ~10m of the previous
	// (0.00009° ≈ 10m of latitude).
	base := pt(35.9092, 14.4258)
	jitter := []TelemetryPoint{
		base,
		pt(35.90928, 14.42582),
		pt(35.90921, 14.42588),
		pt(35.90915, 14.42580),
		pt(35.90923, 14.42575),
		base,
	}

	for i := 1; i < len(jitter); i++ {
		d := haversineMeters(jitter[i-1], jitter[i])
		if d >= cfg.MinimumMovementMeters {
			t.Fatalf("fixture broken: jitter step %d is %.1fm, meant to stay under %.0fm",
				i, d, cfg.MinimumMovementMeters)
		}
		p := jitter[i]
		p.SpeedKph = f64(0) // parked fixes report clean zero (ground truth)
		if isMoving(p, d, cfg) {
			t.Fatalf("drift step %d (%.1fm) counted as movement", i, d)
		}
	}
}
