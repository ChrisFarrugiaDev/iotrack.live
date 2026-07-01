package replay

import (
	"compress/gzip"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"iotrack.live/teltonika.replay.go/internal/logger"
)

// officialCodec8Hex is the official Teltonika Codec 8 example packet (one AVL
// record, CRC 0xC7CF), reused as a realistic raw_packets row.
const officialCodec8Hex = "000000000000003608010000016B40D8EA30010000000000000000000000000000000105021503010101425E0F01F10000601A014E0000000000000000010000C7CF"

func TestMain(m *testing.M) {
	os.Setenv("LOG_MODE", "off")
	logger.InitLogger()
	os.Exit(m.Run())
}

// dateUTC parses a YYYY-MM-DD string into a midnight-UTC time for tests.
func dateUTC(t *testing.T, s string) time.Time {
	t.Helper()
	d, err := time.ParseInLocation("2006-01-02", s, time.UTC)
	if err != nil {
		t.Fatalf("bad date %q: %v", s, err)
	}
	return d
}

// writeGzCSV writes rows (joined with the given delimiter) to a gzipped file in
// dir and returns its path.
func writeGzCSV(t *testing.T, dir, name, delim string, rows [][]string) string {
	t.Helper()
	path := filepath.Join(dir, name)
	f, err := os.Create(path)
	if err != nil {
		t.Fatalf("create %s: %v", path, err)
	}
	defer f.Close()
	gz := gzip.NewWriter(f)
	for _, cols := range rows {
		if _, err := gz.Write([]byte(strings.Join(cols, delim) + "\n")); err != nil {
			t.Fatalf("write row: %v", err)
		}
	}
	if err := gz.Close(); err != nil {
		t.Fatalf("close gzip: %v", err)
	}
	return path
}
