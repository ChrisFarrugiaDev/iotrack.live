package report

import (
	"fmt"
	"strconv"

	"iotrack.live/computation.server.go/internal/models"
)

// NormalizeStats carries the §37 counters. Accepted equals Raw for now —
// the normaliser identifies invalid points but never drops them (§38);
// filtering is the engine's §13 decision, and this split gives it a place
// to report when it arrives.
type NormalizeStats struct {
	Raw        int
	Accepted   int
	InvalidGPS int
}

// Normalize maps raw telemetry rows into the §10 TelemetryPoint shape.
// Everything downstream depends on this shape, never on DB column names or
// vendor payload keys. The encoding rules come from the ROADMAP Phase 2
// ground-truth survey of real payloads, not from documentation guesses.
func Normalize(rows []models.Telemetry) ([]TelemetryPoint, NormalizeStats) {
	points := make([]TelemetryPoint, 0, len(rows))
	stats := NormalizeStats{Raw: len(rows)}

	for _, row := range rows {
		point := normalizeRow(row)
		if !point.GPSValid {
			stats.InvalidGPS++
		}
		points = append(points, point)
	}

	stats.Accepted = len(points)
	return points, stats
}

func normalizeRow(row models.Telemetry) TelemetryPoint {
	payload := row.Telemetry

	point := TelemetryPoint{
		// Row id as a string: BIGSERIAL can pass JavaScript's 2^53 (§18).
		ID: strconv.FormatInt(row.ID, 10),

		// happened_at is the authoritative UTC time; the payload carries an
		// epoch-string copy ("timestamp") which is deliberately ignored.
		Timestamp: row.HappenedAt.UTC(),

		SpeedKph: jsonFloat(payload["speed"]),
		Heading:  jsonFloat(payload["angle"]),
		Altitude: jsonFloat(payload["altitude"]),
	}

	if lat := jsonFloat(payload["latitude"]); lat != nil {
		point.Latitude = *lat
	}
	if lng := jsonFloat(payload["longitude"]); lng != nil {
		point.Longitude = *lng
	}

	// Invalid coordinates are marked, never dropped: out of range, missing,
	// or the exact 0,0 fix (a GPS cold start, not a position off the coast
	// of West Africa).
	point.GPSValid = jsonFloat(payload["latitude"]) != nil &&
		jsonFloat(payload["longitude"]) != nil &&
		point.Latitude >= -90 && point.Latitude <= 90 &&
		point.Longitude >= -180 && point.Longitude <= 180 &&
		!(point.Latitude == 0 && point.Longitude == 0)

	elements, _ := payload["elements"].(map[string]any)
	point.Parameters = normalizeElements(elements, &point)

	return point
}

// normalizeElements lifts the signal elements onto the typed fields and
// names the rest into Parameters. Lifted ids do not repeat in Parameters.
func normalizeElements(elements map[string]any, point *TelemetryPoint) map[string]any {
	if len(elements) == 0 {
		return nil
	}

	parameters := make(map[string]any, len(elements))

	for id, value := range elements {
		switch id {
		case "239": // ignition: JSON number 0/1, never a boolean (survey)
			point.IgnitionOn = numBool(value)

		case "240": // movement
			point.MovementDetected = numBool(value)

		case "1": // digital_input_1 — provisional work-input signal; the
			// per-asset configuration of which input means "working" is a
			// later phase's job.
			point.ActivityOn = numBool(value)

		case "78", "207": // ibutton / rfid — the driver tag rules:
			// number 0 means "no tag present" and maps to absent, and a
			// real tag is kept as a STRING end to end — 18 digits corrupt
			// past 2^53 if ever serialised as a JSON number.
			if tag := tagString(value); tag != "" {
				parameters[ioElementName(id)] = tag
			}

		default:
			// Everything else keeps its value under the parser's name;
			// unknown ids keep their numeric key (ioElementName).
			parameters[ioElementName(id)] = value
		}
	}

	if len(parameters) == 0 {
		return nil
	}
	return parameters
}

// jsonFloat reads a JSON number as decoded from JSONB (encoding/json turns
// every number into float64). Anything else — missing, string, null —
// is nil: "the vendor didn't report it", never zero.
func jsonFloat(v any) *float64 {
	if f, ok := v.(float64); ok {
		return &f
	}
	return nil
}

// numBool converts the 0/1 numbers Teltonika uses for binary signals.
// Absent or unrecognised stays nil — null is never collapsed to false
// (§41.4). Booleans pass through for future vendors that send real ones.
func numBool(v any) *bool {
	switch n := v.(type) {
	case float64:
		b := n != 0
		return &b
	case bool:
		return &n
	default:
		return nil
	}
}

// tagString normalises a driver-tag value: strings pass through, number 0
// (and empty strings) mean "no tag" and return "", any other number is
// stringified without decimals as a defensive fallback — though the parser
// already quotes real tags, so numbers other than 0 should not occur.
func tagString(v any) string {
	switch t := v.(type) {
	case string:
		if t == "0" {
			return ""
		}
		return t
	case float64:
		if t == 0 {
			return ""
		}
		return fmt.Sprintf("%.0f", t)
	default:
		return ""
	}
}
