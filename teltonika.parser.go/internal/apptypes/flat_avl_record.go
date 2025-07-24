package apptypes

type FlatAvlRecord struct {
	Timestamp  string         `json:"timestamp"` // ISO 8601 format (e.g. 2025-06-04T09:51:58.010Z)
	Priority   uint8          `json:"priority"`
	Longitude  float64        `json:"longitude"`
	Latitude   float64        `json:"latitude"`
	Altitude   int16          `json:"altitude"`
	Angle      uint16         `json:"angle"`
	Satellites uint8          `json:"satellites"`
	Speed      uint16         `json:"speed"`
	IOelement  map[string]any `json:"elements"`
}
