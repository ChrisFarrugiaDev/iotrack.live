package report

import (
	"testing"
	"time"
)

var windowBase = time.Date(2026, 7, 18, 12, 0, 0, 0, time.UTC)

// drivePoints is a straight drive: one valid point per minute at 40 km/h,
// creeping east far enough that distance confirms movement too.
func drivePoints(start time.Time, count int) []TelemetryPoint {
	pts := make([]TelemetryPoint, count)
	for i := range pts {
		pts[i] = TelemetryPoint{
			Timestamp: start.Add(time.Duration(i) * time.Minute),
			Latitude:  35.9,
			Longitude: 14.4 + float64(i)*0.0007,
			SpeedKph:  f64(40),
			GPSValid:  true,
		}
	}
	return pts
}

// The frontend fixture's "…" case: the vehicle is already driving when the
// report window opens. §43 v1: the journey is clipped to the window start,
// flagged, and its duration/points/metrics reflect only the covered extent.
func TestJourneySpanningWindowStart(t *testing.T) {
	from := windowBase
	to := windowBase.Add(time.Hour)

	// Driving from 10 minutes before the window until 9 minutes into it.
	points := drivePoints(from.Add(-10*time.Minute), 20)

	segments := BuildSegments(points, VehicleConfig(), from, to)
	if len(segments) != 1 {
		t.Fatalf("got %d segments, want 1", len(segments))
	}
	j, ok := segments[0].(JourneySegment)
	if !ok {
		t.Fatalf("segment is %T, want JourneySegment", segments[0])
	}

	if !j.StartAt.Equal(from) {
		t.Fatalf("StartAt = %v, want clipped to window start %v", j.StartAt, from)
	}
	if j.Boundary == nil || !j.Boundary.StartsBeforeReportRange {
		t.Fatalf("startsBeforeReportRange must be set: %+v", j.Boundary)
	}
	if j.Boundary.EndsAfterReportRange {
		t.Fatal("endsAfterReportRange must not be set — the journey ends inside the window")
	}

	wantEnd := from.Add(9 * time.Minute) // the last point
	if !j.EndAt.Equal(wantEnd) {
		t.Fatalf("EndAt = %v, want %v", j.EndAt, wantEnd)
	}
	if j.DurationSeconds != 9*60 {
		t.Fatalf("DurationSeconds = %d, want %d (the clipped extent)", j.DurationSeconds, 9*60)
	}

	// Only in-window points remain, and the locations follow them.
	if j.PointCount != 10 || len(j.Points) != 10 {
		t.Fatalf("PointCount = %d with %d points, want 10 in-window points", j.PointCount, len(j.Points))
	}
	for _, p := range j.Points {
		if p.Timestamp.Before(from) {
			t.Fatalf("point at %v is before the window start", p.Timestamp)
		}
	}
	if j.StartLocation != locationOf(j.Points[0]) {
		t.Fatalf("StartLocation = %+v, want the first in-window point's location", j.StartLocation)
	}
}

func TestJourneySpanningWindowEnd(t *testing.T) {
	from := windowBase
	to := windowBase.Add(10 * time.Minute)

	// Driving from the window start until well past its end.
	points := drivePoints(from, 20)

	segments := BuildSegments(points, VehicleConfig(), from, to)
	if len(segments) != 1 {
		t.Fatalf("got %d segments, want 1", len(segments))
	}
	j := segments[0].(JourneySegment)

	if !j.EndAt.Equal(to) {
		t.Fatalf("EndAt = %v, want clipped to window end %v", j.EndAt, to)
	}
	if j.Boundary == nil || !j.Boundary.EndsAfterReportRange {
		t.Fatalf("endsAfterReportRange must be set: %+v", j.Boundary)
	}
	if j.Boundary.StartsBeforeReportRange {
		t.Fatal("startsBeforeReportRange must not be set — the journey starts inside the window")
	}

	// Journey starts at the second point (the first only seeds deltas, §17).
	wantStart := from.Add(time.Minute)
	if !j.StartAt.Equal(wantStart) || j.DurationSeconds != 9*60 {
		t.Fatalf("StartAt = %v dur = %d, want %v dur = %d", j.StartAt, j.DurationSeconds, wantStart, 9*60)
	}
	if last := j.Points[len(j.Points)-1]; last.Timestamp.After(to) {
		t.Fatalf("point at %v is after the window end", last.Timestamp)
	}
	if j.EndLocation != locationOf(j.Points[len(j.Points)-1]) {
		t.Fatal("EndLocation must follow the last in-window point")
	}
}

func TestSegmentInsideWindowIsUntouched(t *testing.T) {
	from := windowBase
	to := windowBase.Add(time.Hour)

	points := drivePoints(from.Add(10*time.Minute), 10)

	segments := BuildSegments(points, VehicleConfig(), from, to)
	if len(segments) != 1 {
		t.Fatalf("got %d segments, want 1", len(segments))
	}
	j := segments[0].(JourneySegment)

	if j.Boundary != nil {
		t.Fatalf("a fully in-window segment must carry no boundary: %+v", j.Boundary)
	}
	if j.ID != "segment-1" {
		t.Fatalf("ID = %s, want segment-1", j.ID)
	}
	if j.PointCount != 9 { // second point onwards, §17 seeding
		t.Fatalf("PointCount = %d, want 9", j.PointCount)
	}
}

// A journey wholly before the window is dropped; the data gap that follows
// it is clipped at the window start and keeps its previous location; the
// survivors are renumbered so ids stay sequential.
func TestOutOfWindowSegmentDroppedAndGapClipped(t *testing.T) {
	from := windowBase
	to := windowBase.Add(time.Hour)

	// Drive T-30m..T-21m, silence across the window start, drive T+5m..T+14m.
	points := append(
		drivePoints(from.Add(-30*time.Minute), 10),
		drivePoints(from.Add(5*time.Minute), 10)...,
	)

	segments := BuildSegments(points, VehicleConfig(), from, to)
	if len(segments) != 2 {
		t.Fatalf("got %d segments, want gap + journey", len(segments))
	}

	gap, ok := segments[0].(DataGapSegment)
	if !ok {
		t.Fatalf("first segment is %T, want DataGapSegment", segments[0])
	}
	if gap.ID != "segment-1" {
		t.Fatalf("gap ID = %s, want segment-1 after renumbering", gap.ID)
	}
	if !gap.StartAt.Equal(from) || gap.Boundary == nil || !gap.Boundary.StartsBeforeReportRange {
		t.Fatalf("gap must be clipped to the window start and flagged: startAt=%v boundary=%+v",
			gap.StartAt, gap.Boundary)
	}
	if !gap.EndAt.Equal(from.Add(5*time.Minute)) || gap.DurationSeconds != 5*60 {
		t.Fatalf("gap end = %v dur = %d, want %v dur = %d",
			gap.EndAt, gap.DurationSeconds, from.Add(5*time.Minute), 5*60)
	}
	if gap.PreviousLocation == nil || gap.NextLocation == nil {
		t.Fatal("a clipped gap keeps both locations — they name real points")
	}

	j, ok := segments[1].(JourneySegment)
	if !ok {
		t.Fatalf("second segment is %T, want JourneySegment", segments[1])
	}
	if j.ID != "segment-2" {
		t.Fatalf("journey ID = %s, want segment-2 after renumbering", j.ID)
	}
	if j.Boundary != nil {
		t.Fatalf("the in-window journey must carry no boundary: %+v", j.Boundary)
	}
}
