package apptypes

import "maps"

type FlatAvlRecord struct {
	Timestamp  string         `json:"timestamp"` // ISO 8601 format (e.g. 2025-06-04T09:51:58.010Z)
	Priority   uint8          `json:"priority"`
	Longitude  float64        `json:"longitude"`
	Latitude   float64        `json:"latitude"`
	Altitude   int16          `json:"altitude"`
	Angle      uint16         `json:"angle"`
	Satellites uint8          `json:"satellites"`
	Speed      uint16         `json:"speed"`
	Elements   map[string]any `json:"elements"`
}

// DeepCopy returns a copy of r with its own Elements map so the caller
// cannot race with writers that mutate the original.
func (r FlatAvlRecord) DeepCopy() FlatAvlRecord {
	copied := r
	if r.Elements != nil {
		copied.Elements = make(map[string]any, len(r.Elements))
		maps.Copy(copied.Elements, r.Elements)
	}
	return copied
}
