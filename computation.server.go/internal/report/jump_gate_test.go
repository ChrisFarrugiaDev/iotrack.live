package report

import (
	"testing"
	"time"
)

// TestImplausibleJumpBecomesDataGap covers §14.8: a physically impossible
// jump between two consecutive points is a data_gap, independent of §14.7's
// elapsed-time check — the two fixtures the roadmap calls for.
func TestImplausibleJumpBecomesDataGap(t *testing.T) {
	start := time.Date(2026, 7, 20, 8, 0, 0, 0, time.UTC)
	off := false

	t.Run("a confirmed stop followed by a jump stays two segments, not one", func(t *testing.T) {
		cfg := VehicleConfig() // MaximumPlausibleSpeedKph: 250

		stop := stationaryPoints(start, 300*time.Second, &off) // confirms stationary (> 180s default)
		last := stop[len(stop)-1]

		// depot -> mgarr is ~12km; 5s apart implies well over 250 km/h.
		jump := TelemetryPoint{
			Timestamp: last.Timestamp.Add(5 * time.Second),
			Latitude:  mgarr[0],
			Longitude: mgarr[1],
			SpeedKph:  f64(0),
			GPSValid:  true,
		}

		pts := append(append([]TelemetryPoint{}, stop...), jump)
		segments := BuildSegments(pts, cfg, start, jump.Timestamp)

		if len(segments) != 2 {
			t.Fatalf("want 2 segments (stationary, data_gap), got %d: %#v", len(segments), segments)
		}

		stationary, ok := segments[0].(StationarySegment)
		if !ok {
			t.Fatalf("segment 0 = %T, want StationarySegment", segments[0])
		}
		// The "keep separate" decision: the confirmed stop is untouched by
		// the jump that follows it — it still spans the full stop, not cut
		// short or merged away.
		if !stationary.EndAt.Equal(last.Timestamp) {
			t.Errorf("stationary EndAt = %v, want %v (unmodified by the following jump)", stationary.EndAt, last.Timestamp)
		}

		gap, ok := segments[1].(DataGapSegment)
		if !ok {
			t.Fatalf("segment 1 = %T, want DataGapSegment", segments[1])
		}
		if !gap.StartAt.Equal(last.Timestamp) || !gap.EndAt.Equal(jump.Timestamp) {
			t.Errorf("gap = [%v, %v], want [%v, %v]", gap.StartAt, gap.EndAt, last.Timestamp, jump.Timestamp)
		}
	})

	t.Run("a jump mid-journey splits the journey around a data_gap", func(t *testing.T) {
		cfg := VehicleConfig()

		leg1 := track{
			start: start, end: start.Add(5 * time.Minute), cadence: 30 * time.Second,
			path: []latLng{depot, mosta}, speedKph: 40,
		}.points()
		last := leg1[len(leg1)-1]

		// Jump to marsa, 5s later — physically impossible, same as above.
		jump := TelemetryPoint{
			Timestamp: last.Timestamp.Add(5 * time.Second),
			Latitude:  marsa[0],
			Longitude: marsa[1],
			SpeedKph:  f64(0),
			GPSValid:  true,
		}

		// leg2 starts exactly at marsa, so nothing here trips a second gate
		// on its own first point — only the jump into it should.
		leg2 := track{
			start: jump.Timestamp.Add(30 * time.Second), end: jump.Timestamp.Add(5 * time.Minute),
			cadence: 30 * time.Second, path: []latLng{marsa, mgarr}, speedKph: 40,
		}.points()

		pts := concat(leg1, []TelemetryPoint{jump}, leg2)
		segments := BuildSegments(pts, cfg, start, leg2[len(leg2)-1].Timestamp)

		if len(segments) != 3 {
			t.Fatalf("want 3 segments (journey, data_gap, journey), got %d: %#v", len(segments), segments)
		}

		if _, ok := segments[0].(JourneySegment); !ok {
			t.Fatalf("segment 0 = %T, want JourneySegment", segments[0])
		}

		gap, ok := segments[1].(DataGapSegment)
		if !ok {
			t.Fatalf("segment 1 = %T, want DataGapSegment", segments[1])
		}
		if !gap.StartAt.Equal(last.Timestamp) || !gap.EndAt.Equal(jump.Timestamp) {
			t.Errorf("gap = [%v, %v], want [%v, %v]", gap.StartAt, gap.EndAt, last.Timestamp, jump.Timestamp)
		}

		if _, ok := segments[2].(JourneySegment); !ok {
			t.Fatalf("segment 2 = %T, want JourneySegment", segments[2])
		}
	})

	t.Run("a short silence hiding too much road becomes a data_gap (§14.10)", func(t *testing.T) {
		// The AFO-544 shape (2026-07-21): 235s of silence while driving
		// covered 1156m — under MaximumPointGapSeconds, implied speed
		// (~18 km/h) entirely plausible, so neither §14.7 nor §14.8
		// fired and a straight fabricated "route" was drawn across
		// terrain the tracker never reported. §8.4 forbids assuming
		// direct travel: past MinimumJumpMeters of unseen road, the
		// silence is a data_gap.
		cfg := VehicleConfig() // MinimumRouteHoleSeconds: 90, MinimumJumpMeters: 500

		leg1 := track{
			start: start, end: start.Add(5 * time.Minute), cadence: 10 * time.Second,
			path: []latLng{depot, {35.8901, 14.4802}}, speedKph: 30,
		}.points()
		last := leg1[len(leg1)-1]

		// Reappears 235s later, ~1.1km away, at normal driving speed.
		resume := TelemetryPoint{
			Timestamp: last.Timestamp.Add(235 * time.Second),
			Latitude:  last.Latitude + 0.010,
			Longitude: last.Longitude,
			SpeedKph:  f64(20),
			GPSValid:  true,
		}
		leg2 := track{
			start: resume.Timestamp.Add(10 * time.Second), end: resume.Timestamp.Add(4 * time.Minute),
			cadence: 10 * time.Second, speedKph: 30,
			path: []latLng{{resume.Latitude, resume.Longitude}, {resume.Latitude + 0.008, resume.Longitude + 0.004}},
		}.points()

		pts := concat(leg1, []TelemetryPoint{resume}, leg2)
		segments := BuildSegments(pts, cfg, start, leg2[len(leg2)-1].Timestamp)

		if len(segments) != 3 {
			t.Fatalf("want 3 segments (journey, data_gap, journey), got %d: %#v", len(segments), segments)
		}
		gap, ok := segments[1].(DataGapSegment)
		if !ok {
			t.Fatalf("segment 1 = %T, want DataGapSegment — 1.1km of unseen road must not be drawn as a route", segments[1])
		}
		if !gap.StartAt.Equal(last.Timestamp) || !gap.EndAt.Equal(resume.Timestamp) {
			t.Errorf("gap = [%v, %v], want [%v, %v]", gap.StartAt, gap.EndAt, last.Timestamp, resume.Timestamp)
		}
	})

	t.Run("a sub-floor GPS snap does not split the journey", func(t *testing.T) {
		// Regression for real data (YSM-815, 2026-07-20): pulling away
		// from a 30s traffic stop, the position snapped ~330m in 3s
		// (GPS reacquisition) — implied ~400 km/h, which used to trip the
		// gate and split a real journey with a zero-duration data_gap.
		// Below MinimumJumpMeters the gate must stay quiet; the snap is
		// just a moving point like any other.
		cfg := VehicleConfig() // MinimumJumpMeters: 500

		leg := track{
			start: start, end: start.Add(5 * time.Minute), cadence: 30 * time.Second,
			path: []latLng{depot, mosta}, speedKph: 40,
		}.points()
		last := leg[len(leg)-1]

		// ~330m north of the last point, 3s later — the YSM-815 shape.
		snap := TelemetryPoint{
			Timestamp: last.Timestamp.Add(3 * time.Second),
			Latitude:  last.Latitude + 0.003,
			Longitude: last.Longitude,
			SpeedKph:  f64(39),
			GPSValid:  true,
		}
		after := track{
			start: snap.Timestamp.Add(10 * time.Second), end: snap.Timestamp.Add(2 * time.Minute),
			cadence: 10 * time.Second, speedKph: 40,
			path: []latLng{{snap.Latitude, snap.Longitude}, {snap.Latitude + 0.008, snap.Longitude + 0.004}},
		}.points()

		pts := concat(leg, []TelemetryPoint{snap}, after)
		segments := BuildSegments(pts, cfg, start, after[len(after)-1].Timestamp)

		if len(segments) != 1 {
			t.Fatalf("want 1 continuous journey, got %d: %#v", len(segments), segments)
		}
		if _, ok := segments[0].(JourneySegment); !ok {
			t.Fatalf("segment 0 = %T, want JourneySegment", segments[0])
		}
	})
}
