package report

import (
	"testing"
	"time"
)

// TestBridgeSilentButParkedGap covers §14.9, found against real production
// data (AIC-497): a tracker that drops to an infrequent heartbeat while
// parked must not have that silence read as data_gap when the position is
// unchanged across it.
func TestBridgeSilentButParkedGap(t *testing.T) {
	start := time.Date(2026, 7, 20, 8, 0, 0, 0, time.UTC)
	on := true
	off := false

	// A short journey, then one point where it's stopped — the seed a real
	// stop always has before it can be confirmed (§14.3/§14.4). 15 minutes
	// for depot->mgarr (~13.5km) keeps the interpolated per-step implied
	// speed safely under the §14.8 jump gate (250 km/h) — 2 minutes would
	// itself trip it, since the path generator paces position purely by
	// (start, end, cadence), not by the declared speedKph field.
	journey := track{
		start: start, end: start.Add(15 * time.Minute), cadence: time.Minute,
		path: []latLng{depot, mgarr}, speedKph: 40, ignition: &on,
	}.points()
	stopped := journey[len(journey)-1]

	t.Run("matching position bridges into one stationary segment, no data_gap and no invented working time", func(t *testing.T) {
		// Even with ignition-on on BOTH sides (AIC-497's actual heartbeat
		// shape), a bridged silence confirms as plain stationary — two
		// isolated samples hours apart prove the vehicle stayed put, not
		// that the engine ran throughout (revised 2026-07-21; the first
		// version stamped these active_static and a car showed 2h of
		// "Working" built almost entirely from silences).
		cfg := VehicleConfig()

		q0 := TelemetryPoint{
			Timestamp: stopped.Timestamp.Add(30 * time.Second),
			Latitude:  mgarr[0], Longitude: mgarr[1],
			SpeedKph: f64(0), IgnitionOn: &on, GPSValid: true,
		}
		// 6h later, same spot, same signal — AIC-497's actual shape.
		q1 := TelemetryPoint{
			Timestamp: q0.Timestamp.Add(6 * time.Hour),
			Latitude:  mgarr[0], Longitude: mgarr[1],
			SpeedKph: f64(0), IgnitionOn: &on, GPSValid: true,
		}

		pts := concat(journey, []TelemetryPoint{q0, q1})
		segments := BuildSegments(pts, cfg, start, q1.Timestamp)

		if len(segments) != 2 {
			t.Fatalf("want 2 segments (journey, stationary), got %d: %#v", len(segments), segments)
		}
		if _, ok := segments[0].(JourneySegment); !ok {
			t.Fatalf("segment 0 = %T, want JourneySegment", segments[0])
		}
		stat, ok := segments[1].(StationarySegment)
		if !ok {
			t.Fatalf("segment 1 = %T, want StationarySegment (bridged, not a data_gap; never an invented active_static)", segments[1])
		}
		if !stat.StartAt.Equal(q0.Timestamp) {
			t.Errorf("stationary StartAt = %v, want %v (backdated to the first stationary point)", stat.StartAt, q0.Timestamp)
		}
		if !stat.EndAt.Equal(q1.Timestamp) {
			t.Errorf("stationary EndAt = %v, want %v", stat.EndAt, q1.Timestamp)
		}
	})

	t.Run("conflicting activity still bridges when position is unchanged, as plain stationary", func(t *testing.T) {
		// Revised 2026-07-20 against real data (YSM-815): the original rule
		// refused to bridge when activity conflicted across the silence.
		// Real parked trackers flicker ignition within their wake bursts
		// (1→0 in seconds), so every silence boundary "conflicted" and an
		// unmoved 47-minute parked period shredded into data_gaps. Position
		// alone decides now — data_gap means route unknown (§8.4), and with
		// identical coordinates there is no unknown route. The far point's
		// activity (off here) classifies the bridged span, so a conflicted
		// silence gets the weaker claim (stationary), never an invented
		// active_static.
		cfg := VehicleConfig()

		q0 := TelemetryPoint{
			Timestamp: stopped.Timestamp.Add(30 * time.Second),
			Latitude:  mgarr[0], Longitude: mgarr[1],
			SpeedKph: f64(0), IgnitionOn: &on, GPSValid: true,
		}
		// Same spot, but ignition is now off — the state changed somewhere
		// inside the silence.
		q1 := TelemetryPoint{
			Timestamp: q0.Timestamp.Add(6 * time.Hour),
			Latitude:  mgarr[0], Longitude: mgarr[1],
			SpeedKph: f64(0), IgnitionOn: &off, GPSValid: true,
		}

		pts := concat(journey, []TelemetryPoint{q0, q1})
		segments := BuildSegments(pts, cfg, start, q1.Timestamp)

		if len(segments) != 2 {
			t.Fatalf("want 2 segments (journey, stationary), got %d: %#v", len(segments), segments)
		}
		if _, ok := segments[0].(JourneySegment); !ok {
			t.Fatalf("segment 0 = %T, want JourneySegment", segments[0])
		}
		stat, ok := segments[1].(StationarySegment)
		if !ok {
			t.Fatalf("segment 1 = %T, want StationarySegment (unchanged position bridges; far point's ignition=off keeps it plain stationary)", segments[1])
		}
		if !stat.EndAt.Equal(q1.Timestamp) {
			t.Errorf("stationary EndAt = %v, want %v", stat.EndAt, q1.Timestamp)
		}
	})

	t.Run("a wake burst's ignition-on fix cannot stamp a conflicted silence as working", func(t *testing.T) {
		// The ACA-448 shape (2026-07-21): driver parks with the engine
		// running (dense ignition-on idle → active_static), switches the
		// engine OFF — recorded — then the tracker sleeps for ~2h. The
		// wake burst's first fix reads ignition=1 again. Without the
		// conflicted-silence demotion, that single fix stamped the whole
		// silence "Working — IGNITION"; the honest split is active_static
		// up to the recorded switch-off, plain stationary across the
		// silence.
		cfg := VehicleConfig()

		// Dense ignition-on idle at mgarr: confirms active_static.
		idle := stationaryPoints(stopped.Timestamp.Add(30*time.Second), 240*time.Second, &on)
		for i := range idle {
			idle[i].Latitude, idle[i].Longitude = mgarr[0], mgarr[1]
		}

		// The recorded switch-off, then ~2h of silence, then the wake
		// burst's flickery ignition-on fix. Same position throughout.
		offAt := idle[len(idle)-1].Timestamp.Add(3 * time.Second)
		switchOff := TelemetryPoint{
			Timestamp: offAt,
			Latitude:  mgarr[0], Longitude: mgarr[1],
			SpeedKph: f64(0), IgnitionOn: &off, GPSValid: true,
		}
		wake := TelemetryPoint{
			Timestamp: offAt.Add(2 * time.Hour),
			Latitude:  mgarr[0], Longitude: mgarr[1],
			SpeedKph: f64(0), IgnitionOn: &on, GPSValid: true,
		}

		pts := concat(journey, idle, []TelemetryPoint{switchOff, wake})
		segments := BuildSegments(pts, cfg, start, wake.Timestamp)

		if len(segments) != 3 {
			t.Fatalf("want 3 segments (journey, active_static, stationary), got %d: %#v", len(segments), segments)
		}
		activeSeg, ok := segments[1].(ActiveStaticSegment)
		if !ok {
			t.Fatalf("segment 1 = %T, want ActiveStaticSegment (the dense ignition-on idle)", segments[1])
		}
		// The boundary lands at the start of the last unconfirmed buffer
		// chunk — up to StationaryConfirmationSeconds before the recorded
		// switch-off (the same §15 backdating granularity every dense-data
		// transition has). The essential claim: the silence itself is
		// never inside the active_static segment.
		earliest := switchOff.Timestamp.Add(-time.Duration(cfg.StationaryConfirmationSeconds) * time.Second)
		if activeSeg.EndAt.After(switchOff.Timestamp) || activeSeg.EndAt.Before(earliest) {
			t.Errorf("active_static EndAt = %v, want within [%v, %v] — never past the recorded switch-off", activeSeg.EndAt, earliest, switchOff.Timestamp)
		}
		stat, ok := segments[2].(StationarySegment)
		if !ok {
			t.Fatalf("segment 2 = %T, want StationarySegment — a conflicted silence claims only what position proves, never active_static", segments[2])
		}
		if !stat.StartAt.Equal(activeSeg.EndAt) || !stat.EndAt.Equal(wake.Timestamp) {
			t.Errorf("stationary = [%v, %v], want [%v (contiguous), %v]", stat.StartAt, stat.EndAt, activeSeg.EndAt, wake.Timestamp)
		}
	})

	// A moving point on the far side of the gap must never bridge, even if
	// its position happens to match — TestScenarioEGapNotBridged (two
	// journeys sharing an endpoint by coincidence, both ignition=true)
	// already pins this exact invariant; it's why §14.9 gates on
	// `!isMoving`, not a bare position/activity comparison.
}
