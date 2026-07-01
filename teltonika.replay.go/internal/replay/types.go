package replay

import "time"

// ReplayPacket is one decoded CSV row, before Codec 8 parsing. Only the raw
// hex-decoded bytes are held at load time; parsing happens at fire time (§5.0).
type ReplayPacket struct {
	IMEI       string
	HappenedAt time.Time // original UTC timestamp from CSV column 1
	Raw        []byte    // hex-decoded column 3 (full Codec 8 packet)
}

// ReplayDay is the per-day plan: whitelisted devices only, each device's packets
// grouped and sorted ascending by HappenedAt, plus the whole-day time offset
// applied to scheduling and to published timestamps (§4, §14).
type ReplayDay struct {
	FileDate time.Time                 // midnight UTC of the file's date
	Offset   time.Duration             // activationMidnight - FileDate (§4.1)
	ByDevice map[string][]ReplayPacket // IMEI -> sorted packets
}
