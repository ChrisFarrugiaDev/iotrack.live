package apptypes

type Telemetry struct {
	IMEI       string         `json:"imei"`
	AssetID    *string        `json:"asset_id,omitempty"`
	Timestamp  string         `json:"timestamp"`
	Priority   uint8          `json:"priority"`
	Longitude  float64        `json:"longitude"`
	Latitude   float64        `json:"latitude"`
	Altitude   int16          `json:"altitude"`
	Angle      uint16         `json:"angle"`
	Satellites uint8          `json:"satellites"`
	Speed      uint16         `json:"speed"`
	EventID    int            `json:"event_id"`
	Elements   map[string]any `json:"elements"`
}
