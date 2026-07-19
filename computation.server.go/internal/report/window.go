package report

import (
	"fmt"
	"time"
)

// clipToWindow is the §43 v1 boundary pass, applied after the state machine:
// segments are clipped to the report window [from, to], edge segments carry
// the boundary flags, and durations reflect the clipped extent so the §23
// summary reconciles to the covered window. Segments wholly outside the
// window are dropped and the survivors renumbered, keeping ids sequential.
//
// In production the service fetches only in-window points, so this pass is
// a no-op today; it exists so the engine stays correct when the §43
// look-behind/look-ahead fetch widening lands (Later), and so fixtures can
// exercise a journey already underway at the window edge.
func clipToWindow(segments []ActivitySegment, from, to time.Time) []ActivitySegment {
	clipped := make([]ActivitySegment, 0, len(segments))

	for _, segment := range segments {
		kept, ok := clipSegment(segment, from, to)
		if !ok {
			continue
		}
		clipped = append(clipped, kept)
	}

	for i := range clipped {
		renumber(&clipped[i], i+1)
	}
	return clipped
}

// clipBase clips the shared fields. ok is false when the segment lies
// wholly outside the window (zero overlap — edge-touching counts as
// outside, a zero-duration sliver is not a segment).
func clipBase(base SegmentBase, from, to time.Time) (_ SegmentBase, ok bool) {
	if !base.EndAt.After(from) || !base.StartAt.Before(to) {
		return base, false
	}

	var boundary SegmentBoundary
	if base.StartAt.Before(from) {
		base.StartAt = from
		boundary.StartsBeforeReportRange = true
	}
	if base.EndAt.After(to) {
		base.EndAt = to
		boundary.EndsAfterReportRange = true
	}
	if boundary != (SegmentBoundary{}) {
		base.Boundary = &boundary
	}
	base.DurationSeconds = int(base.EndAt.Sub(base.StartAt).Seconds())
	return base, true
}

// clipSegment applies clipBase and, when a segment was actually cut, trims
// its points to the window and recomputes what derives from them. A gap
// keeps its previous/next locations — they name real points and stay
// informative even when the gap itself is cut by the window edge.
func clipSegment(segment ActivitySegment, from, to time.Time) (ActivitySegment, bool) {
	switch s := segment.(type) {
	case JourneySegment:
		base, ok := clipBase(s.SegmentBase, from, to)
		if !ok {
			return nil, false
		}
		s.SegmentBase = base
		if base.Boundary != nil {
			s.Points = pointsWithin(s.Points, from, to)
			if len(s.Points) == 0 {
				return nil, false
			}
			s.PointCount = len(s.Points)
			s.StartLocation = locationOf(s.Points[0])
			s.EndLocation = locationOf(s.Points[len(s.Points)-1])
			s.DistanceMeters, s.AverageSpeedKph, s.MaximumSpeedKph =
				journeyMetrics(s.Points, base.DurationSeconds)
		}
		return s, true

	case ActiveStaticSegment:
		base, ok := clipBase(s.SegmentBase, from, to)
		if !ok {
			return nil, false
		}
		s.SegmentBase = base
		if base.Boundary != nil {
			s.Points = pointsWithin(s.Points, from, to)
			if len(s.Points) == 0 {
				return nil, false
			}
			s.PointCount = len(s.Points)
			s.Location = locationOf(s.Points[0])
		}
		return s, true

	case StationarySegment:
		base, ok := clipBase(s.SegmentBase, from, to)
		if !ok {
			return nil, false
		}
		s.SegmentBase = base
		if base.Boundary != nil {
			s.Points = pointsWithin(s.Points, from, to)
			if len(s.Points) == 0 {
				return nil, false
			}
			s.PointCount = len(s.Points)
			s.Location = locationOf(s.Points[0])
		}
		return s, true

	case DataGapSegment:
		base, ok := clipBase(s.SegmentBase, from, to)
		if !ok {
			return nil, false
		}
		s.SegmentBase = base
		return s, true
	}

	return segment, true
}

// pointsWithin keeps the points inside [from, to], both edges inclusive.
func pointsWithin(points []TelemetryPoint, from, to time.Time) []TelemetryPoint {
	kept := make([]TelemetryPoint, 0, len(points))
	for _, p := range points {
		if p.Timestamp.Before(from) || p.Timestamp.After(to) {
			continue
		}
		kept = append(kept, p)
	}
	return kept
}

func renumber(segment *ActivitySegment, n int) {
	id := fmt.Sprintf("segment-%d", n)
	switch s := (*segment).(type) {
	case JourneySegment:
		s.ID = id
		*segment = s
	case ActiveStaticSegment:
		s.ID = id
		*segment = s
	case StationarySegment:
		s.ID = id
		*segment = s
	case DataGapSegment:
		s.ID = id
		*segment = s
	}
}
