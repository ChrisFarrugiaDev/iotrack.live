package util

import (
	"bytes"
	"encoding/json"
	"strconv"
	"strings"
)

// NormalizeIDs ensures that numeric fields (like id, organisation_id, asset_id)
// are converted to int64 when they might arrive as strings or json.Number.
// Useful when data comes from Redis/JS where big ints are serialized as strings.
// This is an advanced version of normalizeIDs and normalizeIDs_deprecated see for better understanding
func NormalizeIDs(b []byte, fields ...string) ([]byte, error) {
	// Create a JSON decoder on the raw bytes
	dec := json.NewDecoder(bytes.NewReader(b))
	dec.UseNumber() // Keep numbers as json.Number instead of float64 for precision

	// Decode into a generic map
	var m map[string]any

	if err := dec.Decode(&m); err != nil {
		return nil, err
	}

	// Loop over each requested field and normalize if needed
	for _, f := range fields {
		switch v := m[f].(type) {
		case string: // If the field is a string, try to parse as int64
			n, err := strconv.ParseInt(strings.TrimSpace(v), 10, 64)
			if err == nil {
				m[f] = n
			}
		case json.Number: // If the field is json.Number, convert safely to int64
			n, err := v.Int64()
			if err == nil {
				m[f] = n
			}
		}
	}

	// Marshal the normalized map back into JSON
	return json.Marshal(m)
}

// normalizeIDs ensures numeric fields (eg: id, organisation_id, asset_id) are
// converted to int64 if they arrive as strings in JSON from Redis.
// See: normalizeIDs_deprecated for better understanding
func normalizeIDs(jsonItem string, fields ...string) ([]byte, error) {
	var m map[string]any

	err := json.Unmarshal([]byte(jsonItem), &m)
	if err != nil {
		return nil, err
	}

	for _, f := range fields {
		s, ok := m[f].(string)

		if ok {
			n, err := strconv.ParseInt(s, 10, 64)
			if err == nil {
				m[f] = n
			}
		}
	}

	return json.Marshal(m)
}

func normalizeIDs_deprecated(jsonItem string) ([]byte, error) {
	var m map[string]any
	if err := json.Unmarshal([]byte(jsonItem), &m); err != nil {
		return nil, err
	}
	if s, ok := m["id"].(string); ok {
		if n, err := strconv.ParseInt(s, 10, 64); err == nil {
			m["id"] = n
		}
	}
	if s, ok := m["organisation_id"].(string); ok {
		if n, err := strconv.ParseInt(s, 10, 64); err == nil {
			m["organisation_id"] = n
		}
	}
	if s, ok := m["asset_id"].(string); ok {
		if n, err := strconv.ParseInt(s, 10, 64); err == nil {
			m["asset_id"] = n
		}
	}
	return json.Marshal(m)
}

// ---------------------------------------------------------------------
