package report

import "time"

// ActivitySegment is the §18 discriminated union. It is sealed by the
// unexported marker method: each concrete type marshals exactly its own
// contract fields, so a shape violation — like a data gap carrying points —
// is a compile-time impossibility, not a runtime bug. Field names are
// pinned in SPEC.md ("Segments and response — pinned") and were read from
// the frontend contract file, the authority.
type ActivitySegment interface{ segment() }

// SegmentBase carries the fields every segment type shares.
type SegmentBase struct {
	ID              string           `json:"id"`   // "segment-1", … assigned by the engine
	Type            string           `json:"type"` // the union discriminator
	StartAt         time.Time        `json:"startAt"`
	EndAt           time.Time        `json:"endAt"`
	DurationSeconds int              `json:"durationSeconds"`
	Boundary        *SegmentBoundary `json:"boundary,omitempty"` // §43, only on window-edge segments
}

func (SegmentBase) segment() {}

// JourneySegment — type "journey" (§18.2).
type JourneySegment struct {
	SegmentBase

	DistanceMeters  float64  `json:"distanceMeters"`
	AverageSpeedKph *float64 `json:"averageSpeedKph"`
	MaximumSpeedKph *float64 `json:"maximumSpeedKph"`

	StartLocation ReportLocation `json:"startLocation"`
	EndLocation   ReportLocation `json:"endLocation"`

	PointCount int              `json:"pointCount"`
	Points     []TelemetryPoint `json:"points"`

	// became_active_static | became_stationary | data_gap | report_end
	EndReason string `json:"endReason"`
}

// ActiveStaticSegment — type "active_static": stationary but working (§8.2).
type ActiveStaticSegment struct {
	SegmentBase

	Location ReportLocation `json:"location"`

	PointCount int              `json:"pointCount"`
	Points     []TelemetryPoint `json:"points"`

	ActivitySource ActivitySource `json:"activitySource"`
}

// StationarySegment — type "stationary".
type StationarySegment struct {
	SegmentBase

	Location ReportLocation `json:"location"`

	PointCount int              `json:"pointCount"`
	Points     []TelemetryPoint `json:"points"`
}

// DataGapSegment — type "data_gap". Structurally has NO points and no
// route: the path through a gap is unknown and must never be drawn as one
// (§8.4). Locations are nullable per the contract — a gap at the window
// edge may lack one side.
type DataGapSegment struct {
	SegmentBase

	PreviousLocation *ReportLocation `json:"previousLocation"`
	NextLocation     *ReportLocation `json:"nextLocation"`
}

// ReportLocation is a bare coordinate pair; address arrives with reverse
// geocoding (§28), later.
type ReportLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// SegmentBoundary marks a segment clipped by the report window (§43).
type SegmentBoundary struct {
	StartsBeforeReportRange bool `json:"startsBeforeReportRange"`
	EndsAfterReportRange    bool `json:"endsAfterReportRange"`
}

// locationOf projects a point onto the map contract.
func locationOf(p TelemetryPoint) ReportLocation {
	return ReportLocation{Latitude: p.Latitude, Longitude: p.Longitude}
}

// journeyMetrics derives a journey's figures from its points (§22):
// distance as the haversine sum over consecutive points, maximum from the
// reported speeds (nil when no point reported one — never 0), and average
// from distance over the segment duration (nil when the duration is zero).
func journeyMetrics(points []TelemetryPoint, durationSeconds int) (distanceMeters float64, averageKph, maximumKph *float64) {
	for i := 1; i < len(points); i++ {
		distanceMeters += haversineMeters(points[i-1], points[i])
	}

	for _, p := range points {
		if p.SpeedKph == nil {
			continue
		}
		if maximumKph == nil || *p.SpeedKph > *maximumKph {
			v := *p.SpeedKph
			maximumKph = &v
		}
	}

	if durationSeconds > 0 {
		avg := distanceMeters / float64(durationSeconds) * 3.6
		averageKph = &avg
	}

	return distanceMeters, averageKph, maximumKph
}
