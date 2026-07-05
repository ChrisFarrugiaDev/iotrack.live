package replay

import (
	"encoding/hex"
	"testing"

	"iotrack.live/teltonika.replay.go/internal/teltonika"
)

const (
	imeiA = "864275075775927"
	imeiB = "864275076484925"
	imeiC = "864636069136725"
)

func TestLoadFileWhitelistFilters(t *testing.T) {
	dir := t.TempDir()
	rows := [][]string{
		{"2026-04-10 00:00:00+00", imeiA, officialCodec8Hex},
		{"2026-04-10 00:01:05+00", imeiB, officialCodec8Hex},
		{"2026-04-10 00:02:00+00", imeiA, officialCodec8Hex},
		{"2026-04-10 00:03:00+00", imeiC, officialCodec8Hex},
	}
	path := writeGzCSV(t, dir, "raw_packets_2026-04-10.csv.gz", "\t", rows)

	wl := NewWhitelist(imeiA+","+imeiC, true)
	byDevice, err := LoadFile(path, wl, NewBlacklist(""), nil, "\t")
	if err != nil {
		t.Fatalf("LoadFile: %v", err)
	}

	// Only whitelisted IMEIs survive; imeiB is dropped before decode or masking.
	if len(byDevice) != 2 {
		t.Fatalf("devices = %d, want 2 (%v)", len(byDevice), keys(byDevice))
	}
	if _, ok := byDevice[MaskIMEI(imeiB)]; ok {
		t.Errorf("imeiB should have been filtered out")
	}
	if got := len(byDevice[MaskIMEI(imeiA)]); got != 2 {
		t.Errorf("imeiA packets = %d, want 2", got)
	}
	if got := len(byDevice[MaskIMEI(imeiC)]); got != 1 {
		t.Errorf("imeiC packets = %d, want 1", got)
	}
}

func TestLoadFileEmptyWhitelistRequired(t *testing.T) {
	dir := t.TempDir()
	rows := [][]string{
		{"2026-04-10 00:00:00+00", imeiA, officialCodec8Hex},
		{"2026-04-10 00:01:00+00", imeiB, officialCodec8Hex},
	}
	path := writeGzCSV(t, dir, "raw_packets_2026-04-10.csv.gz", "\t", rows)

	// required=true + empty whitelist => replay nothing.
	byDevice, err := LoadFile(path, NewWhitelist("", true), NewBlacklist(""), nil, "\t")
	if err != nil {
		t.Fatalf("LoadFile: %v", err)
	}
	if len(byDevice) != 0 {
		t.Fatalf("devices = %d, want 0 (empty+required replays nothing)", len(byDevice))
	}
}

func TestLoadFileEmptyWhitelistNotRequired(t *testing.T) {
	dir := t.TempDir()
	rows := [][]string{
		{"2026-04-10 00:00:00+00", imeiA, officialCodec8Hex},
		{"2026-04-10 00:01:00+00", imeiB, officialCodec8Hex},
	}
	path := writeGzCSV(t, dir, "raw_packets_2026-04-10.csv.gz", "\t", rows)

	// required=false + empty whitelist => replay all.
	byDevice, err := LoadFile(path, NewWhitelist("", false), NewBlacklist(""), nil, "\t")
	if err != nil {
		t.Fatalf("LoadFile: %v", err)
	}
	if len(byDevice) != 2 {
		t.Fatalf("devices = %d, want 2 (empty+not-required replays all)", len(byDevice))
	}
}

func TestLoadFileSkipsMalformedRows(t *testing.T) {
	dir := t.TempDir()
	rows := [][]string{
		{"2026-04-10 00:00:00+00", imeiA, officialCodec8Hex}, // good
		{"2026-04-10 00:01:00+00", imeiA},                    // too few columns
		{"not-a-timestamp", imeiA, officialCodec8Hex},        // bad timestamp
		{"2026-04-10 00:02:00+00", imeiA, "zzzz"},            // bad hex
		{"2026-04-10 00:03:00+00", "", officialCodec8Hex},    // empty IMEI
		{"2026-04-10 00:04:00+00", imeiA, officialCodec8Hex}, // good
	}
	path := writeGzCSV(t, dir, "raw_packets_2026-04-10.csv.gz", "\t", rows)

	byDevice, err := LoadFile(path, NewWhitelist(imeiA, true), NewBlacklist(""), nil, "\t")
	if err != nil {
		t.Fatalf("LoadFile: %v", err)
	}
	if got := len(byDevice[MaskIMEI(imeiA)]); got != 2 {
		t.Fatalf("kept packets = %d, want 2 (malformed rows skipped)", got)
	}
}

// TestLoadFileDecodesRealRow covers the §17 "Codec 8 parse against a real sample
// row" case: the loaded raw bytes must hex-decode correctly and parse as Codec 8.
func TestLoadFileDecodesRealRow(t *testing.T) {
	dir := t.TempDir()
	rows := [][]string{{"2026-04-10 00:00:00+00", imeiA, officialCodec8Hex}}
	path := writeGzCSV(t, dir, "raw_packets_2026-04-10.csv.gz", "\t", rows)

	byDevice, err := LoadFile(path, NewWhitelist(imeiA, true), NewBlacklist(""), nil, "\t")
	if err != nil {
		t.Fatalf("LoadFile: %v", err)
	}
	pkts := byDevice[MaskIMEI(imeiA)]
	if len(pkts) != 1 {
		t.Fatalf("packets = %d, want 1", len(pkts))
	}

	want, _ := hex.DecodeString(officialCodec8Hex)
	if string(pkts[0].Raw) != string(want) {
		t.Fatalf("raw bytes do not match decoded hex")
	}

	record, err := teltonika.ParseCodec8(pkts[0].Raw)
	if err != nil {
		t.Fatalf("ParseCodec8 on loaded row: %v", err)
	}
	if record.CodecID != 0x08 || record.CRC != 0xC7CF {
		t.Fatalf("parsed codec/CRC = %#x/%#x, want 0x08/0xC7CF", record.CodecID, record.CRC)
	}
}

func TestLoadFileMissing(t *testing.T) {
	_, err := LoadFile(t.TempDir()+"/does-not-exist.csv.gz", NewWhitelist(imeiA, true), NewBlacklist(""), nil, "\t")
	if err == nil {
		t.Fatal("expected an error for a missing file")
	}
}

func TestLoadFileWildcardWhitelistAllowsAll(t *testing.T) {
	dir := t.TempDir()
	rows := [][]string{
		{"2026-04-10 00:00:00+00", imeiA, officialCodec8Hex},
		{"2026-04-10 00:01:00+00", imeiB, officialCodec8Hex},
		{"2026-04-10 00:02:00+00", imeiC, officialCodec8Hex},
	}
	path := writeGzCSV(t, dir, "raw_packets_2026-04-10.csv.gz", "\t", rows)

	// "*" in whitelist => every IMEI passes.
	byDevice, err := LoadFile(path, NewWhitelist("*", true), NewBlacklist(""), nil, "\t")
	if err != nil {
		t.Fatalf("LoadFile: %v", err)
	}
	if len(byDevice) != 3 {
		t.Fatalf("devices = %d, want 3 (wildcard allows all)", len(byDevice))
	}
}

func TestLoadFileBlacklistDeniesOverWhitelist(t *testing.T) {
	dir := t.TempDir()
	rows := [][]string{
		{"2026-04-10 00:00:00+00", imeiA, officialCodec8Hex},
		{"2026-04-10 00:01:00+00", imeiB, officialCodec8Hex},
		{"2026-04-10 00:02:00+00", imeiC, officialCodec8Hex},
	}
	path := writeGzCSV(t, dir, "raw_packets_2026-04-10.csv.gz", "\t", rows)

	// Whitelist allows all three; blacklist removes imeiB.
	wl := NewWhitelist(imeiA+","+imeiB+","+imeiC, true)
	bl := NewBlacklist(imeiB)
	byDevice, err := LoadFile(path, wl, bl, nil, "\t")
	if err != nil {
		t.Fatalf("LoadFile: %v", err)
	}
	if len(byDevice) != 2 {
		t.Fatalf("devices = %d, want 2 (blacklisted imeiB removed)", len(byDevice))
	}
	if _, ok := byDevice[MaskIMEI(imeiB)]; ok {
		t.Errorf("imeiB should have been denied by blacklist")
	}
}

func TestLoadFileWildcardBlacklistDeniesAll(t *testing.T) {
	dir := t.TempDir()
	rows := [][]string{
		{"2026-04-10 00:00:00+00", imeiA, officialCodec8Hex},
		{"2026-04-10 00:01:00+00", imeiB, officialCodec8Hex},
	}
	path := writeGzCSV(t, dir, "raw_packets_2026-04-10.csv.gz", "\t", rows)

	// "*" in blacklist => nothing passes, even with a permissive whitelist.
	byDevice, err := LoadFile(path, NewWhitelist("*", true), NewBlacklist("*"), nil, "\t")
	if err != nil {
		t.Fatalf("LoadFile: %v", err)
	}
	if len(byDevice) != 0 {
		t.Fatalf("devices = %d, want 0 (wildcard blacklist blocks all)", len(byDevice))
	}
}

func keys(m map[string][]ReplayPacket) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
