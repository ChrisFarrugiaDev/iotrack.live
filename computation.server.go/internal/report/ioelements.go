package report

// ioElementNames maps Teltonika IO element ids to names, copied verbatim
// from teltonika.parser.go/internal/teltonika/IoElementsMap.go — two
// services disagreeing on a name is a contract bug, so this subset must
// never drift from the parser's spelling.
//
// The subset is every id observed in real dev-database payloads (see the
// ROADMAP Phase 2 ground-truth survey) plus rfid, which the report reads
// when present. Ids not listed here pass through under their numeric key —
// never dropped, never renamed by guesswork.
var ioElementNames = map[string]string{
	"1":   "digital_input_1",
	"11":  "iccid1",
	"12":  "fuel_used_gps",
	"14":  "iccid2",
	"16":  "total_odometer",
	"21":  "gsm_signal",
	"66":  "external_voltage",
	"67":  "battery_voltage",
	"68":  "battery_current",
	"69":  "gnss_status",
	"78":  "ibutton",
	"80":  "data_mode",
	"100": "can_program_number",
	"181": "gnss_pdop",
	"182": "gnss_hdop",
	"200": "sleep_mode",
	"206": "gsm_area_code",
	"207": "rfid",
	"239": "ignition",
	"240": "movement",
	"241": "active_gsm_operator",
	"248": "immobilizer",
}

// ioElementName returns the parser's name for an IO element id, or the id
// itself when unmapped.
func ioElementName(id string) string {
	if name, ok := ioElementNames[id]; ok {
		return name
	}
	return id
}
