package report

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

// parkedPoints is one point per minute at a fixed location, speed 0, with
// the given ignition state (nil = unknown).
func parkedPoints(start time.Time, count int, lat, lng float64, ignition *bool) []TelemetryPoint {
	pts := make([]TelemetryPoint, count)
	for i := range pts {
		pts[i] = TelemetryPoint{
			Timestamp:  start.Add(time.Duration(i) * time.Minute),
			Latitude:   lat,
			Longitude:  lng,
			SpeedKph:   f64(0),
			IgnitionOn: ignition,
			GPSValid:   true,
		}
	}
	return pts
}

// A full day-in-miniature through the real engine: drive → work stop
// (ignition on) → silence → drive → parked (ignition off). The summary must
// be exactly what the segments say — §23 forbids computing it another way.
func TestSummariseFullTimeline(t *testing.T) {
	T := windowBase
	from, to := T, T.Add(time.Hour)

	drive1 := drivePoints(T, 10)                    // T .. T+9m
	workLoc := drive1[len(drive1)-1]                // stop where the drive ended
	work := parkedPoints(T.Add(10*time.Minute), 6, workLoc.Latitude, workLoc.Longitude, b(true))
	// 11 minutes of silence: a data gap (> 300s).
	drive2 := drivePoints(T.Add(26*time.Minute), 10) // T+26m .. T+35m
	endLoc := drive2[len(drive2)-1]
	parked := parkedPoints(T.Add(36*time.Minute), 5, endLoc.Latitude, endLoc.Longitude, b(false))

	var points []TelemetryPoint
	for _, batch := range [][]TelemetryPoint{drive1, work, drive2, parked} {
		points = append(points, batch...)
	}

	segments := BuildSegments(points, VehicleConfig(), from, to)

	wantTypes := []string{"journey", "active_static", "data_gap", "journey", "stationary"}
	var gotTypes []string
	for _, s := range segments {
		gotTypes = append(gotTypes, baseOf(s).Type)
	}
	if strings.Join(gotTypes, ",") != strings.Join(wantTypes, ",") {
		t.Fatalf("segment types = %v, want %v", gotTypes, wantTypes)
	}

	s := Summarise(segments)

	if s.JourneyCount != 2 {
		t.Fatalf("JourneyCount = %d, want 2", s.JourneyCount)
	}
	if s.MovingSeconds != 1080 || s.ActiveStaticSeconds != 300 ||
		s.StationarySeconds != 240 || s.CommunicationGapSeconds != 660 {
		t.Fatalf("buckets = moving %d active %d stationary %d gap %d, want 1080/300/240/660",
			s.MovingSeconds, s.ActiveStaticSeconds, s.StationarySeconds, s.CommunicationGapSeconds)
	}
	if s.TotalDistanceMeters <= 0 {
		t.Fatalf("TotalDistanceMeters = %v, want > 0", s.TotalDistanceMeters)
	}

	// Point bookkeeping follows the segments, not the input slice.
	wantPoints := 0
	for _, seg := range segments {
		wantPoints += pointCountOf(seg)
	}
	if s.PointCount != wantPoints {
		t.Fatalf("PointCount = %d, segments carry %d", s.PointCount, wantPoints)
	}
	if s.FirstPointAt == nil || !s.FirstPointAt.Equal(T.Add(1*time.Minute)) {
		t.Fatalf("FirstPointAt = %v, want %v (the first segment point)", s.FirstPointAt, T.Add(1*time.Minute))
	}
	if s.LastPointAt == nil || !s.LastPointAt.Equal(T.Add(40*time.Minute)) {
		t.Fatalf("LastPointAt = %v, want %v (the last segment point)", s.LastPointAt, T.Add(40*time.Minute))
	}
}

// The §23 reconciliation invariant, as the frontend mock's deriveSummary
// enforces it: segments are ordered and non-overlapping, every duration is
// exactly EndAt−StartAt, and the four summary buckets partition the total
// segment time — nothing counted twice, nothing invented.
func TestSummaryReconciliation(t *testing.T) {
	T := windowBase
	drive1 := drivePoints(T, 10)
	last := drive1[len(drive1)-1]
	parked := parkedPoints(T.Add(10*time.Minute), 6, last.Latitude, last.Longitude, nil)
	drive2 := drivePoints(T.Add(30*time.Minute), 10) // after a 14-minute gap

	points := append(append(drive1, parked...), drive2...)
	segments := BuildSegments(points, VehicleConfig(), T, T.Add(time.Hour))
	if len(segments) < 3 {
		t.Fatalf("timeline produced only %d segments", len(segments))
	}

	total := 0
	for i, seg := range segments {
		base := baseOf(seg)
		if base.DurationSeconds != int(base.EndAt.Sub(base.StartAt).Seconds()) {
			t.Fatalf("%s: DurationSeconds %d does not match EndAt−StartAt", base.ID, base.DurationSeconds)
		}
		if i > 0 && base.StartAt.Before(baseOf(segments[i-1]).EndAt) {
			t.Fatalf("%s starts before the previous segment ends", base.ID)
		}
		total += base.DurationSeconds
	}

	s := Summarise(segments)
	buckets := s.MovingSeconds + s.ActiveStaticSeconds + s.StationarySeconds + s.CommunicationGapSeconds
	if buckets != total {
		t.Fatalf("buckets sum to %d, segments cover %d", buckets, total)
	}
}

func TestSummariseEmptyMarshalsNulls(t *testing.T) {
	s := Summarise(nil)
	if s.PointCount != 0 || s.JourneyCount != 0 || s.TotalDistanceMeters != 0 {
		t.Fatalf("empty summary must be all zero: %+v", s)
	}

	encoded, err := json.Marshal(s)
	if err != nil {
		t.Fatalf("marshalling: %v", err)
	}
	// null, present — never omitted, never a zero time (§41.4 spirit).
	for _, key := range []string{`"firstPointAt":null`, `"lastPointAt":null`} {
		if !strings.Contains(string(encoded), key) {
			t.Fatalf("summary JSON missing %s: %s", key, encoded)
		}
	}
}

// baseOf and pointCountOf unwrap the union for tests — production code
// never needs this, which is why they live here.
func baseOf(segment ActivitySegment) SegmentBase {
	switch s := segment.(type) {
	case JourneySegment:
		return s.SegmentBase
	case ActiveStaticSegment:
		return s.SegmentBase
	case StationarySegment:
		return s.SegmentBase
	case DataGapSegment:
		return s.SegmentBase
	}
	return SegmentBase{}
}

func pointCountOf(segment ActivitySegment) int {
	switch s := segment.(type) {
	case JourneySegment:
		return s.PointCount
	case ActiveStaticSegment:
		return s.PointCount
	case StationarySegment:
		return s.PointCount
	}
	return 0
}
