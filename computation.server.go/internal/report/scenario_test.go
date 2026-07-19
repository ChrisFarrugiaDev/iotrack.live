package report

import (
	"math"
	"testing"
	"time"
)

// This file is the Go twin of the frontend mock's waypoint generator
// (web.frontend.vue/src/mock/activity-report.mock.ts) and the §36.2
// scenario fixtures. The mock stays the visual reference; these tests are
// the engine's acceptance. Where the engine's documented §17 semantics
// differ from the mock's hand-declared minutes, the test asserts the
// engine's number and says why.

type latLng [2]float64

var (
	depot     = latLng{35.8825, 14.5090}
	mosta     = latLng{35.9092, 14.4258}
	mgarr     = latLng{35.9375, 14.3754}
	marsa     = latLng{35.8617, 14.4885}
	resumeLoc = latLng{35.8410, 14.5390} // where data comes back after the gap
)

// pointOnPath positions a fraction t (0..1) along a polyline of waypoints
// — a direct port of the mock's helper.
func pointOnPath(path []latLng, t float64) (lat, lng float64) {
	t = math.Min(math.Max(t, 0), 1)
	span := float64(len(path)-1) * t
	i := min(int(span), len(path)-2)
	local := span - float64(i)

	a, b := path[i], path[i+1]
	return a[0] + (b[0]-a[0])*local, a[1] + (b[1]-a[1])*local
}

// track generates evenly spaced points along a path, the mock's
// buildPoints with a cadence instead of a count. An optional stop freezes
// position and zeroes speed — the traffic light that must not split a
// journey (§14.2).
type track struct {
	start, end time.Time
	cadence    time.Duration
	path       []latLng
	speedKph   float64
	ignition   *bool
	activity   *bool
	params     map[string]any

	stopFrom, stopTo time.Time
}

func (tr track) points() []TelemetryPoint {
	total := tr.end.Sub(tr.start).Seconds()

	var pts []TelemetryPoint
	i := 0
	for ts := tr.start; !ts.After(tr.end); ts = ts.Add(tr.cadence) {
		at := ts
		stopped := !tr.stopFrom.IsZero() && !ts.Before(tr.stopFrom) && !ts.After(tr.stopTo)
		if stopped {
			at = tr.stopFrom
		}

		frac := 0.0
		if total > 0 {
			frac = at.Sub(tr.start).Seconds() / total
		}
		lat, lng := pointOnPath(tr.path, frac)

		// The mock varies speed so detail views aren't suspiciously flat.
		speed := 0.0
		if tr.speedKph > 0 && !stopped {
			speed = tr.speedKph * (0.7 + 0.6*math.Abs(math.Sin(float64(i))))
		}

		pts = append(pts, TelemetryPoint{
			Timestamp:  ts,
			Latitude:   lat,
			Longitude:  lng,
			SpeedKph:   f64(speed),
			IgnitionOn: tr.ignition,
			ActivityOn: tr.activity,
			Parameters: tr.params,
			GPSValid:   true,
		})
		i++
	}
	return pts
}

func concat(tracks ...[]TelemetryPoint) []TelemetryPoint {
	var pts []TelemetryPoint
	for _, t := range tracks {
		pts = append(pts, t...)
	}
	return pts
}

// - Scenario C — the cherry-picker day (the mock's exact timeline) -------

// Scenario C replays the mock's day: a journey already under way at 06:00
// with a traffic light inside it, PTO work at Mosta, a drive to Mġarr and
// a parked break, a drive to Marsa ending in 30 minutes of silence, the
// last drive home, and the vehicle still parked when the window closes.
//
// One deliberate departure from the mock: its traffic light lasts 160s,
// but with ignition reported the §11 fallback makes any stop ≥
// StaticConfirmationSeconds (120s) active_static — so here the light is
// 90s and the tension is recorded in the roadmap's tuning note.
func TestScenarioCCherryPickerDay(t *testing.T) {
	day := time.Date(2026, 7, 12, 0, 0, 0, 0, time.UTC)
	at := func(h, m int) time.Time { return day.Add(time.Duration(h)*time.Hour + time.Duration(m)*time.Minute) }
	from, to := at(6, 0), at(18, 0)

	ibutton := map[string]any{"ibutton": "122600709064491241"}
	pto := map[string]any{"pto": true, "ibutton": "122600709064491241"}
	rfid := map[string]any{"rfid": "4207891635"}

	points := concat(
		// Driving since 05:50 — the window opens mid-journey (§43).
		track{start: at(5, 50), end: at(6, 37), cadence: time.Minute, speedKph: 40,
			path:     []latLng{depot, {35.8901, 14.4802}, {35.8985, 14.4501}, mosta},
			ignition: b(true), activity: b(false), params: ibutton,
			stopFrom: at(6, 10), stopTo: at(6, 11).Add(30 * time.Second)}.points(),
		// Cherry picker up at Mosta: stationary, PTO on (scenario C proper).
		track{start: at(6, 38), end: at(9, 4), cadence: 2 * time.Minute, speedKph: 0,
			path: []latLng{mosta, mosta}, ignition: b(true), activity: b(true), params: pto}.points(),
		track{start: at(9, 5), end: at(9, 33), cadence: time.Minute, speedKph: 35,
			path:     []latLng{mosta, {35.9235, 14.4010}, mgarr},
			ignition: b(true), activity: b(false), params: ibutton}.points(),
		// Parked at Mġarr, ignition off.
		track{start: at(9, 34), end: at(11, 16), cadence: 2 * time.Minute, speedKph: 0,
			path: []latLng{mgarr, mgarr}, ignition: b(false), activity: b(false)}.points(),
		// Second driver (RFID) to Marsa; the tracker then goes silent.
		track{start: at(11, 17), end: at(12, 2), cadence: time.Minute, speedKph: 45,
			path:     []latLng{mgarr, {35.9002, 14.4200}, marsa},
			ignition: b(true), activity: b(false), params: rfid}.points(),
		// 30 minutes of silence, then data resumes south of Marsa.
		track{start: at(12, 32), end: at(13, 13), cadence: time.Minute, speedKph: 30,
			path:     []latLng{resumeLoc, {35.8600, 14.5250}, depot},
			ignition: b(true), activity: b(false), params: rfid}.points(),
		// Parked at the depot past the end of the window.
		track{start: at(13, 14), end: at(18, 10), cadence: 2 * time.Minute, speedKph: 0,
			path: []latLng{depot, depot}, ignition: b(false), activity: b(false)}.points(),
	)

	segments := BuildSegments(points, VehicleConfig(), from, to)

	type expect struct {
		kind     string
		start    time.Time
		end      time.Time
		duration int
	}
	want := []expect{
		{"journey", at(6, 0), at(6, 38), 2280}, // clipped at the window start
		{"active_static", at(6, 38), at(9, 5), 8820},
		{"journey", at(9, 5), at(9, 34), 1740},
		{"stationary", at(9, 34), at(11, 17), 6180},
		{"journey", at(11, 17), at(12, 2), 2700},
		{"data_gap", at(12, 2), at(12, 32), 1800},
		// The mock declares 12:32; the engine starts at 12:33 because the
		// first point after a gap only seeds deltas (§17, documented).
		{"journey", at(12, 33), at(13, 14), 2460},
		{"stationary", at(13, 14), at(18, 0), 17160}, // clipped at the window end
	}

	if len(segments) != len(want) {
		t.Fatalf("got %d segments, want %d", len(segments), len(want))
	}
	for i, w := range want {
		base := baseOf(segments[i])
		if base.Type != w.kind || !base.StartAt.Equal(w.start) || !base.EndAt.Equal(w.end) ||
			base.DurationSeconds != w.duration {
			t.Fatalf("segment %d = %s [%v → %v] %ds, want %s [%v → %v] %ds",
				i+1, base.Type, base.StartAt, base.EndAt, base.DurationSeconds,
				w.kind, w.start, w.end, w.duration)
		}
	}

	// §43 partial flags at both window edges, nowhere else.
	for i, segment := range segments {
		base := baseOf(segment)
		switch i {
		case 0:
			if base.Boundary == nil || !base.Boundary.StartsBeforeReportRange || base.Boundary.EndsAfterReportRange {
				t.Fatalf("first segment boundary = %+v, want startsBeforeReportRange only", base.Boundary)
			}
		case len(segments) - 1:
			if base.Boundary == nil || !base.Boundary.EndsAfterReportRange || base.Boundary.StartsBeforeReportRange {
				t.Fatalf("last segment boundary = %+v, want endsAfterReportRange only", base.Boundary)
			}
		default:
			if base.Boundary != nil {
				t.Fatalf("segment %d must carry no boundary: %+v", i+1, base.Boundary)
			}
		}
	}

	// End reasons tell the day's story.
	wantReasons := []string{"became_active_static", "became_stationary", "data_gap", "became_stationary"}
	var gotReasons []string
	for _, segment := range segments {
		if j, ok := segment.(JourneySegment); ok {
			gotReasons = append(gotReasons, j.EndReason)
		}
	}
	for i, want := range wantReasons {
		if gotReasons[i] != want {
			t.Fatalf("journey %d endReason = %s, want %s", i+1, gotReasons[i], want)
		}
	}

	// The work is PTO-sourced (§11 first priority), as the mock declares.
	work := segments[1].(ActiveStaticSegment)
	if work.ActivitySource != SourcePTO {
		t.Fatalf("activitySource = %s, want %s", work.ActivitySource, SourcePTO)
	}

	// The gap names its real endpoints and nothing in between (§8.4).
	gap := segments[5].(DataGapSegment)
	if gap.PreviousLocation == nil || gap.NextLocation == nil {
		t.Fatal("gap must carry both endpoint locations")
	}
	if math.Abs(gap.PreviousLocation.Latitude-marsa[0]) > 1e-6 ||
		math.Abs(gap.NextLocation.Latitude-resumeLoc[0]) > 1e-6 {
		t.Fatalf("gap endpoints = %+v → %+v, want Marsa → the resume point",
			gap.PreviousLocation, gap.NextLocation)
	}

	// And the summary reconciles over the whole day.
	s := Summarise(segments)
	if s.JourneyCount != 4 {
		t.Fatalf("JourneyCount = %d, want 4", s.JourneyCount)
	}
	total := 0
	for _, segment := range segments {
		total += baseOf(segment).DurationSeconds
	}
	if got := s.MovingSeconds + s.ActiveStaticSeconds + s.StationarySeconds + s.CommunicationGapSeconds; got != total {
		t.Fatalf("summary buckets sum to %d, segments cover %d", got, total)
	}
}

// - Scenario A — one simple journey --------------------------------------

func TestScenarioASimpleJourney(t *testing.T) {
	T := windowBase
	points := track{start: T.Add(5 * time.Minute), end: T.Add(35 * time.Minute),
		cadence: time.Minute, speedKph: 40, path: []latLng{depot, mosta},
		ignition: b(true), activity: b(false)}.points()

	segments := BuildSegments(points, VehicleConfig(), T, T.Add(time.Hour))
	if len(segments) != 1 {
		t.Fatalf("got %d segments, want 1 journey", len(segments))
	}
	j := segments[0].(JourneySegment)
	if j.EndReason != "report_end" || j.Boundary != nil {
		t.Fatalf("endReason = %s boundary = %+v, want report_end with no boundary", j.EndReason, j.Boundary)
	}
	if j.DistanceMeters <= 0 || j.AverageSpeedKph == nil || j.MaximumSpeedKph == nil {
		t.Fatalf("metrics = %v/%v/%v, want distance and both speeds", j.DistanceMeters, j.AverageSpeedKph, j.MaximumSpeedKph)
	}
}

// - Scenario B — a 45s traffic light stays one journey (§14.2) -----------

func TestScenarioBTrafficLightStaysOneJourney(t *testing.T) {
	T := windowBase
	points := track{start: T, end: T.Add(20 * time.Minute),
		cadence: 30 * time.Second, speedKph: 40, path: []latLng{depot, marsa},
		ignition: b(true), activity: b(false),
		stopFrom: T.Add(10 * time.Minute), stopTo: T.Add(10*time.Minute + 45*time.Second)}.points()

	segments := BuildSegments(points, VehicleConfig(), T, T.Add(time.Hour))
	if len(segments) != 1 {
		t.Fatalf("got %d segments, want the traffic light absorbed into 1 journey", len(segments))
	}
	j := segments[0].(JourneySegment)
	// Every point after the §17 seed belongs to the journey — the stopped
	// points were absorbed, not dropped.
	if j.PointCount != len(points)-1 {
		t.Fatalf("PointCount = %d, want %d (all points except the seed)", j.PointCount, len(points)-1)
	}
}

// - Scenario D — 10m parking jitter stays stationary (§36.2 D) -----------

func TestScenarioDJitterStaysStationary(t *testing.T) {
	T := windowBase
	points := make([]TelemetryPoint, 15)
	for i := range points {
		jitter := 0.00009 * float64(i%2) // ~10m alternating drift
		points[i] = TelemetryPoint{
			Timestamp:  T.Add(time.Duration(i) * time.Minute),
			Latitude:   mgarr[0] + jitter,
			Longitude:  mgarr[1],
			SpeedKph:   f64(0),
			IgnitionOn: b(false),
			GPSValid:   true,
		}
	}

	segments := BuildSegments(points, VehicleConfig(), T, T.Add(time.Hour))
	if len(segments) != 1 {
		t.Fatalf("got %d segments, want 1 stationary", len(segments))
	}
	if _, ok := segments[0].(StationarySegment); !ok {
		t.Fatalf("segment is %T, want StationarySegment — jitter must never become a journey", segments[0])
	}
}

// - Scenario E — a 30-minute gap is never bridged as a route (§8.4) ------

func TestScenarioEGapNotBridged(t *testing.T) {
	T := windowBase
	points := concat(
		track{start: T, end: T.Add(10 * time.Minute), cadence: time.Minute,
			speedKph: 40, path: []latLng{depot, marsa}, ignition: b(true)}.points(),
		track{start: T.Add(40 * time.Minute), end: T.Add(50 * time.Minute), cadence: time.Minute,
			speedKph: 40, path: []latLng{marsa, mosta}, ignition: b(true)}.points(),
	)

	segments := BuildSegments(points, VehicleConfig(), T, T.Add(time.Hour))
	wantTypes := []string{"journey", "data_gap", "journey"}
	if len(segments) != 3 {
		t.Fatalf("got %d segments, want %v", len(segments), wantTypes)
	}
	for i, want := range wantTypes {
		if got := baseOf(segments[i]).Type; got != want {
			t.Fatalf("segment %d = %s, want %s", i+1, got, want)
		}
	}
	if j := segments[0].(JourneySegment); j.EndReason != "data_gap" {
		t.Fatalf("first journey endReason = %s, want data_gap", j.EndReason)
	}
	if gap := segments[1].(DataGapSegment); gap.DurationSeconds != 1800 {
		t.Fatalf("gap = %ds, want 1800", gap.DurationSeconds)
	}
}

// - Scenario G — no activity signal at all (production-common) -----------

// The surveyed fleet reports neither pto nor engine_running, and some
// trackers omit ignition too. Journeys must still form, confirmed stops
// become stationary, and active_static is never invented from nothing.
func TestScenarioGNoActivitySignal(t *testing.T) {
	T := windowBase
	points := concat(
		track{start: T, end: T.Add(10 * time.Minute), cadence: time.Minute,
			speedKph: 40, path: []latLng{depot, mgarr}}.points(),
		track{start: T.Add(11 * time.Minute), end: T.Add(25 * time.Minute), cadence: time.Minute,
			speedKph: 0, path: []latLng{mgarr, mgarr}}.points(),
		track{start: T.Add(26 * time.Minute), end: T.Add(36 * time.Minute), cadence: time.Minute,
			speedKph: 40, path: []latLng{mgarr, mosta}}.points(),
	)

	segments := BuildSegments(points, VehicleConfig(), T, T.Add(time.Hour))
	wantTypes := []string{"journey", "stationary", "journey"}
	if len(segments) != 3 {
		t.Fatalf("got %d segments, want %v", len(segments), wantTypes)
	}
	for i, want := range wantTypes {
		if got := baseOf(segments[i]).Type; got != want {
			t.Fatalf("segment %d = %s, want %s — active_static must never be invented", i+1, got, want)
		}
	}
	if j := segments[0].(JourneySegment); j.EndReason != "became_stationary" {
		t.Fatalf("first journey endReason = %s, want became_stationary", j.EndReason)
	}
}
