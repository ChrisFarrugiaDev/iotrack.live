package report

import "time"

// Summary is the §19.3 report summary, pinned in SPEC.md. Derived from the
// segments only, never computed independently from raw points (§23) — so
// the summary and the segments structurally cannot disagree.
type Summary struct {
	FirstPointAt *time.Time `json:"firstPointAt"` // null when the range is empty
	LastPointAt  *time.Time `json:"lastPointAt"`

	PointCount   int `json:"pointCount"`
	JourneyCount int `json:"journeyCount"`

	TotalDistanceMeters float64 `json:"totalDistanceMeters"`

	MovingSeconds           int `json:"movingSeconds"`
	ActiveStaticSeconds     int `json:"activeStaticSeconds"`
	StationarySeconds       int `json:"stationarySeconds"`
	CommunicationGapSeconds int `json:"communicationGapSeconds"`
}

// Summarise folds the segment sequence into the §23 summary — the Go twin
// of the frontend mock's deriveSummary. Segments arrive in time order with
// their points sorted, so the first point of the first point-bearing
// segment and the last point of the last one bracket the report.
func Summarise(segments []ActivitySegment) Summary {
	var s Summary

	for _, segment := range segments {
		switch seg := segment.(type) {
		case JourneySegment:
			s.JourneyCount++
			s.TotalDistanceMeters += seg.DistanceMeters
			s.MovingSeconds += seg.DurationSeconds
			s.tallyPoints(seg.Points)

		case ActiveStaticSegment:
			s.ActiveStaticSeconds += seg.DurationSeconds
			s.tallyPoints(seg.Points)

		case StationarySegment:
			s.StationarySeconds += seg.DurationSeconds
			s.tallyPoints(seg.Points)

		case DataGapSegment:
			s.CommunicationGapSeconds += seg.DurationSeconds
			// A gap has no points (§8.4) — nothing to tally.
		}
	}

	return s
}

func (s *Summary) tallyPoints(points []TelemetryPoint) {
	s.PointCount += len(points)
	if len(points) == 0 {
		return
	}
	if s.FirstPointAt == nil {
		first := points[0].Timestamp
		s.FirstPointAt = &first
	}
	last := points[len(points)-1].Timestamp
	s.LastPointAt = &last
}
