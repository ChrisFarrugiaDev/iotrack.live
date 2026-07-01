package teltonika

import (
	"encoding/hex"
	"os"
	"strings"
	"testing"

	"iotrack.live/teltonika.replay.go/internal/logger"
)

func TestMain(m *testing.M) {
	os.Setenv("LOG_MODE", "off")
	logger.InitLogger()
	os.Exit(m.Run())
}

func TestParseCodec8ParsesOfficialExample(t *testing.T) {
	packet := decodeHexFixture(t, `
		000000000000003608010000016B40D8EA300100000000000000000000000000000001
		05021503010101425E0F01F10000601A014E0000000000000000010000C7CF
	`)

	record, err := ParseCodec8(packet)
	if err != nil {
		t.Fatalf("ParseCodec8 returned error: %v", err)
	}

	if record.CodecID != 0x08 {
		t.Fatalf("CodecID = %#x, want %#x", record.CodecID, 0x08)
	}
	if record.DataLength != 0x36 {
		t.Fatalf("DataLength = %#x, want %#x", record.DataLength, 0x36)
	}
	if record.Quantity1 != 1 || record.Quantity2 != 1 {
		t.Fatalf("quantities = %d/%d, want 1/1", record.Quantity1, record.Quantity2)
	}
	if record.CRC != 0xC7CF {
		t.Fatalf("CRC = %#x, want %#x", record.CRC, 0xC7CF)
	}

	avl := record.Content.AVL_Datas[0]
	if avl.Timestamp != "1560161086" || avl.HappenedAt != "2019-06-10T10:04:46Z" {
		t.Fatalf("timestamp = %q / %q, want 1560161086 / 2019-06-10T10:04:46Z", avl.Timestamp, avl.HappenedAt)
	}
	if avl.IOelement.EventID != 1 || avl.IOelement.ElementCount != 5 {
		t.Fatalf("IO event/count = %d/%d, want 1/5", avl.IOelement.EventID, avl.IOelement.ElementCount)
	}

	assertGPSZero(t, avl.GPSelement.Longitude, avl.GPSelement.Latitude, avl.GPSelement.Altitude, avl.GPSelement.Angle, avl.GPSelement.Satellites, avl.GPSelement.Speed)
	assertElement(t, avl.IOelement.Elements, "21", 3)
	assertElement(t, avl.IOelement.Elements, "1", 1)
	assertElement(t, avl.IOelement.Elements, "66", 24079)
	assertElement(t, avl.IOelement.Elements, "241", int32(24602))
	assertElement(t, avl.IOelement.Elements, "78", uint64(0))
}

func decodeHexFixture(t *testing.T, fixture string) []byte {
	t.Helper()

	clean := strings.NewReplacer("\n", "", "\t", "", " ", "").Replace(fixture)
	data, err := hex.DecodeString(clean)
	if err != nil {
		t.Fatalf("failed to decode hex fixture: %v", err)
	}
	return data
}

func assertGPSZero(t *testing.T, longitude, latitude float64, altitude int16, angle uint16, satellites uint8, speed uint16) {
	t.Helper()

	if longitude != 0 || latitude != 0 || altitude != 0 || angle != 0 || satellites != 0 || speed != 0 {
		t.Fatalf("GPS = lon:%v lat:%v alt:%v angle:%v satellites:%v speed:%v, want all zero",
			longitude, latitude, altitude, angle, satellites, speed)
	}
}

func assertElement(t *testing.T, elements map[string]any, id string, want any) {
	t.Helper()

	got, ok := elements[id]
	if !ok {
		t.Fatalf("missing IO element %q", id)
	}
	if got != want {
		t.Fatalf("IO element %q = %#v (%T), want %#v (%T)", id, got, got, want, want)
	}
}
