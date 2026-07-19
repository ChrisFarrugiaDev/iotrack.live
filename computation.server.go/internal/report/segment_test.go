package report

import (
	"encoding/json"
	"sort"
	"testing"
	"time"
)

// marshalKeys returns the sorted top-level JSON keys of a segment — the
// tests pin each type to EXACTLY its §18 fields, nothing more or less.
func marshalKeys(t *testing.T, segment ActivitySegment) []string {
	t.Helper()

	encoded, err := json.Marshal(segment)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var m map[string]any
	if err := json.Unmarshal(encoded, &m); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

func equalKeys(t *testing.T, got, want []string) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("keys = %v, want %v", got, want)
	}
	for i := range got {
		if got[i] != want[i] {
			t.Fatalf("keys = %v, want %v", got, want)
		}
	}
}

var testBase = SegmentBase{
	ID:              "segment-1",
	StartAt:         time.Date(2026, 7, 12, 6, 0, 0, 0, time.UTC),
	EndAt:           time.Date(2026, 7, 12, 6, 38, 0, 0, time.UTC),
	DurationSeconds: 2280,
}

func TestJourneySegmentMarshalsItsContractFields(t *testing.T) {
	base := testBase
	base.Type = "journey"
	segment := JourneySegment{
		SegmentBase:   base,
		StartLocation: ReportLocation{35.88, 14.50},
		EndLocation:   ReportLocation{35.90, 14.42},
		Points:        []TelemetryPoint{},
		EndReason:     "became_stationary",
	}

	equalKeys(t, marshalKeys(t, segment), []string{
		"averageSpeedKph", "distanceMeters", "durationSeconds", "endAt",
		"endLocation", "endReason", "id", "maximumSpeedKph", "pointCount",
		"points", "startAt", "startLocation", "type",
	})
}

func TestActiveStaticSegmentMarshalsItsContractFields(t *testing.T) {
	base := testBase
	base.Type = "active_static"
	segment := ActiveStaticSegment{
		SegmentBase:    base,
		Location:       ReportLocation{35.90, 14.42},
		Points:         []TelemetryPoint{},
		ActivitySource: SourcePTO,
	}

	equalKeys(t, marshalKeys(t, segment), []string{
		"activitySource", "durationSeconds", "endAt", "id", "location",
		"pointCount", "points", "startAt", "type",
	})
}

func TestStationarySegmentMarshalsItsContractFields(t *testing.T) {
	base := testBase
	base.Type = "stationary"
	segment := StationarySegment{
		SegmentBase: base,
		Location:    ReportLocation{35.94, 14.37},
		Points:      []TelemetryPoint{},
	}

	equalKeys(t, marshalKeys(t, segment), []string{
		"durationSeconds", "endAt", "id", "location", "pointCount",
		"points", "startAt", "type",
	})
}

// The report's most important honesty property (§8.4): a data gap carries
// no points and no route — the type cannot even express them.
func TestDataGapSegmentHasNoPoints(t *testing.T) {
	base := testBase
	base.Type = "data_gap"
	segment := DataGapSegment{
		SegmentBase:      base,
		PreviousLocation: &ReportLocation{35.86, 14.49},
		NextLocation:     nil, // nullable per contract, e.g. at a window edge
	}

	keys := marshalKeys(t, segment)
	equalKeys(t, keys, []string{
		"durationSeconds", "endAt", "id", "nextLocation",
		"previousLocation", "startAt", "type",
	})

	encoded, _ := json.Marshal(segment)
	var m map[string]any
	_ = json.Unmarshal(encoded, &m)
	if m["nextLocation"] != nil {
		t.Fatalf("nextLocation should marshal to null, got %#v", m["nextLocation"])
	}
}

func TestBoundaryAppearsOnlyWhenSet(t *testing.T) {
	base := testBase
	base.Type = "stationary"
	segment := StationarySegment{SegmentBase: base, Points: []TelemetryPoint{}}

	for _, k := range marshalKeys(t, segment) {
		if k == "boundary" {
			t.Fatal("boundary must be omitted when nil")
		}
	}

	segment.Boundary = &SegmentBoundary{StartsBeforeReportRange: true}
	found := false
	for _, k := range marshalKeys(t, segment) {
		if k == "boundary" {
			found = true
		}
	}
	if !found {
		t.Fatal("boundary missing when set")
	}
}

// A []ActivitySegment of mixed concrete types must marshal as the §18
// union — this is exactly what the response's segments array is.
func TestSegmentSliceMarshalsAsUnion(t *testing.T) {
	journeyBase, gapBase := testBase, testBase
	journeyBase.Type = "journey"
	gapBase.Type = "data_gap"

	segments := []ActivitySegment{
		JourneySegment{SegmentBase: journeyBase, Points: []TelemetryPoint{}, EndReason: "data_gap"},
		DataGapSegment{SegmentBase: gapBase},
	}

	encoded, err := json.Marshal(segments)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var decoded []map[string]any
	if err := json.Unmarshal(encoded, &decoded); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if decoded[0]["type"] != "journey" || decoded[1]["type"] != "data_gap" {
		t.Fatalf("discriminators wrong: %s", encoded)
	}
}

func TestJourneyMetrics(t *testing.T) {
	// Two legs of ~1111.9m each (0.01° latitude), 10 minutes total.
	points := []TelemetryPoint{
		{Latitude: 35.90, Longitude: 14.50, SpeedKph: f64(20)},
		{Latitude: 35.91, Longitude: 14.50, SpeedKph: f64(58)},
		{Latitude: 35.92, Longitude: 14.50, SpeedKph: f64(31)},
	}

	distance, avg, max := journeyMetrics(points, 600)

	if distance < 2200 || distance > 2250 {
		t.Fatalf("distance = %.1f, want ~2223.8", distance)
	}
	if max == nil || *max != 58 {
		t.Fatalf("max = %v, want 58", max)
	}
	// 2223.8m over 600s = ~13.3 km/h.
	if avg == nil || *avg < 13 || *avg > 13.7 {
		t.Fatalf("avg = %v, want ~13.3", avg)
	}
}

func TestJourneyMetricsWithoutSpeeds(t *testing.T) {
	points := []TelemetryPoint{
		{Latitude: 35.90, Longitude: 14.50},
		{Latitude: 35.91, Longitude: 14.50},
	}

	_, avg, max := journeyMetrics(points, 0)

	if max != nil {
		t.Fatalf("max = %v, want nil when no point reported a speed — never 0", *max)
	}
	if avg != nil {
		t.Fatalf("avg = %v, want nil for a zero duration", *avg)
	}
}
