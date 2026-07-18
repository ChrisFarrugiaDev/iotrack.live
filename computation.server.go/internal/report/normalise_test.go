package report

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"iotrack.live/computation.server.go/internal/models"
)

// The fixtures are real payloads sampled from the dev database (Phase 2
// Step 4), not invented ones — each was chosen for the shape it proves:
//
//   payloadTagged   full modern row with a REAL 18-digit ibutton string;
//   payloadNoTag    modern driving row, ibutton number 0 = "no tag";
//   payloadSparse   old row: elements hold ONLY the unmapped id 385, the
//                   fix is 0,0, and ignition/movement/din1 are absent —
//                   one real row exercising the nil paths, the invalid-GPS
//                   rule, and unknown-id passthrough at once.
const (
	payloadTagged = `{"angle": 344, "speed": 0, "altitude": 0, "elements": {"1": 1, "12": 1934035, "16": 7778418, "21": 5, "66": 26008, "67": 3934, "68": 0, "69": 1, "78": "106006797973717058", "80": 1, "181": 9, "182": 6, "200": 0, "239": 1, "240": 1, "241": 27877, "248": 2}, "latitude": 35.9458, "priority": 1, "longitude": 14.3895266, "timestamp": "1783435794", "satellites": 16}`
	payloadNoTag  = `{"angle": 124, "speed": 75, "altitude": 143, "elements": {"1": 1, "12": 2490960, "16": 31065452, "21": 5, "66": 12280, "67": 4038, "68": 0, "69": 1, "78": 0, "80": 1, "181": 10, "182": 6, "200": 0, "239": 1, "240": 1, "241": 27877, "248": 0}, "latitude": 35.9545366, "priority": 0, "longitude": 14.3604316, "timestamp": "1783435841", "satellites": 17}`
	payloadSparse = `{"angle": 0, "speed": 0, "altitude": 0, "elements": {"385": "11"}, "latitude": 0, "priority": 0, "longitude": 0, "timestamp": "1758481338", "satellites": 0}`
)

// row builds a models.Telemetry the way pgx delivers it: the JSONB payload
// decoded by encoding/json, so numbers are float64 — same as production.
func row(t *testing.T, id int64, happenedAt time.Time, payload string) models.Telemetry {
	t.Helper()

	var decoded map[string]any
	if err := json.Unmarshal([]byte(payload), &decoded); err != nil {
		t.Fatalf("decoding fixture: %v", err)
	}
	return models.Telemetry{ID: id, HappenedAt: happenedAt, Telemetry: decoded}
}

var happened = time.Date(2026, 7, 7, 14, 50, 41, 0, time.UTC)

func TestNormalizeTaggedRow(t *testing.T) {
	points, _ := Normalize([]models.Telemetry{row(t, 101, happened, payloadTagged)})
	p := points[0]

	if p.ID != "101" {
		t.Fatalf("ID = %q, want the row id as a string", p.ID)
	}
	if !p.Timestamp.Equal(happened) {
		t.Fatalf("Timestamp = %v, want happened_at — the payload epoch must be ignored", p.Timestamp)
	}
	if !p.GPSValid || p.Latitude != 35.9458 || p.Longitude != 14.3895266 {
		t.Fatalf("coords = %v %v (valid=%v), want the real fix", p.Latitude, p.Longitude, p.GPSValid)
	}

	// speed is PRESENT with value 0 — a reported zero, not an absence.
	if p.SpeedKph == nil || *p.SpeedKph != 0 {
		t.Fatalf("SpeedKph = %v, want non-nil 0", p.SpeedKph)
	}
	if p.Heading == nil || *p.Heading != 344 {
		t.Fatalf("Heading = %v, want 344", p.Heading)
	}

	// 0/1 numbers became booleans.
	if p.IgnitionOn == nil || !*p.IgnitionOn {
		t.Fatalf("IgnitionOn = %v, want true", p.IgnitionOn)
	}
	if p.MovementDetected == nil || !*p.MovementDetected {
		t.Fatalf("MovementDetected = %v, want true", p.MovementDetected)
	}
	if p.ActivityOn == nil || !*p.ActivityOn {
		t.Fatalf("ActivityOn = %v, want true (digital_input_1 = 1)", p.ActivityOn)
	}

	// The real 18-digit tag survives as a string.
	tag, ok := p.Parameters["ibutton"].(string)
	if !ok || tag != "106006797973717058" {
		t.Fatalf("parameters.ibutton = %#v, want the 18-digit string", p.Parameters["ibutton"])
	}

	// Lifted signals must not repeat under their parameter names.
	for _, lifted := range []string{"ignition", "movement", "digital_input_1"} {
		if _, exists := p.Parameters[lifted]; exists {
			t.Fatalf("parameters[%q] present — lifted signals must not have two sources of truth", lifted)
		}
	}

	// The rest arrived under parser names.
	if p.Parameters["gsm_signal"] != float64(5) || p.Parameters["total_odometer"] != float64(7778418) {
		t.Fatalf("named parameters wrong: %#v", p.Parameters)
	}
}

func TestNormalizeNoTagRow(t *testing.T) {
	points, _ := Normalize([]models.Telemetry{row(t, 102, happened, payloadNoTag)})
	p := points[0]

	// ibutton number 0 means "no tag present" — absent, not a driver "0".
	if _, exists := p.Parameters["ibutton"]; exists {
		t.Fatalf("parameters.ibutton = %#v, want absent for number 0", p.Parameters["ibutton"])
	}
	if p.SpeedKph == nil || *p.SpeedKph != 75 {
		t.Fatalf("SpeedKph = %v, want 75", p.SpeedKph)
	}
}

func TestNormalizeSparseRow(t *testing.T) {
	points, stats := Normalize([]models.Telemetry{row(t, 103, happened, payloadSparse)})
	p := points[0]

	// Absent signals stay nil — null is never collapsed to false (§41.4).
	if p.IgnitionOn != nil || p.MovementDetected != nil || p.ActivityOn != nil {
		t.Fatalf("absent signals must be nil: ign=%v mov=%v act=%v",
			p.IgnitionOn, p.MovementDetected, p.ActivityOn)
	}

	// The 0,0 fix is marked invalid but the point is KEPT.
	if p.GPSValid {
		t.Fatal("GPSValid = true for the 0,0 fix, want false")
	}
	if stats.Raw != 1 || stats.Accepted != 1 || stats.InvalidGPS != 1 {
		t.Fatalf("stats = %+v, want raw 1 accepted 1 invalidGPS 1 — identified, not dropped", stats)
	}

	// Unmapped id 385 survives under its numeric key.
	if p.Parameters["385"] != "11" {
		t.Fatalf("parameters[385] = %#v, want the raw value under the numeric key", p.Parameters["385"])
	}
}

// The marshalled JSON is the frontend contract — pin the shapes that
// matter: null (not false) for unknown signals, and the ibutton QUOTED.
func TestNormalizeMarshalledShape(t *testing.T) {
	points, _ := Normalize([]models.Telemetry{
		row(t, 101, happened, payloadTagged),
		row(t, 103, happened, payloadSparse),
	})

	tagged, err := json.Marshal(points[0])
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if !strings.Contains(string(tagged), `"ibutton":"106006797973717058"`) {
		t.Fatalf("ibutton not a quoted string in JSON: %s", tagged)
	}
	if !strings.Contains(string(tagged), `"ignitionOn":true`) {
		t.Fatalf("ignitionOn should be boolean true: %s", tagged)
	}

	sparse, err := json.Marshal(points[1])
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if !strings.Contains(string(sparse), `"ignitionOn":null`) {
		t.Fatalf("unknown ignition must marshal to null, never false: %s", sparse)
	}
	if !strings.Contains(string(sparse), `"gpsValid":false`) {
		t.Fatalf("invalid fix must be visible in JSON: %s", sparse)
	}
}

func TestNormalizeStats(t *testing.T) {
	points, stats := Normalize([]models.Telemetry{
		row(t, 1, happened, payloadTagged),
		row(t, 2, happened, payloadNoTag),
		row(t, 3, happened, payloadSparse),
	})

	if len(points) != 3 {
		t.Fatalf("len(points) = %d, want 3 — nothing is dropped in Phase 2", len(points))
	}
	if stats.Raw != 3 || stats.Accepted != 3 || stats.InvalidGPS != 1 {
		t.Fatalf("stats = %+v, want raw 3 accepted 3 invalidGPS 1", stats)
	}
}
