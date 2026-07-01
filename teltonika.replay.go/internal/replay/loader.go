package replay

import (
	"bufio"
	"compress/gzip"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go.uber.org/zap"
	"iotrack.live/teltonika.replay.go/internal/logger"
)

// happenedAtLayout is the CSV column-1 timestamp format, e.g.
// "2026-04-10 00:00:00+00" — RFC3339-ish UTC with a numeric zone (§3.2).
const happenedAtLayout = "2006-01-02 15:04:05-07"

// filePrefix / fileSuffix bracket the date in a daily file name (§3.1):
// raw_packets_<YYYY-MM-DD>.csv.gz.
const (
	filePrefix = "raw_packets_"
	fileSuffix = ".csv.gz"
	fileDate   = "2006-01-02"
)

// scannerMaxLine bounds a single CSV row. A hex Codec 8 packet is at most a few
// KB; 1 MB is comfortably above any real row and guards against a runaway line.
const scannerMaxLine = 1 << 20

// Whitelist is the fixed set of IMEIs to replay (§3.4). It is read once at
// startup and applied on every file load.
type Whitelist struct {
	set      map[string]struct{}
	required bool
}

// NewWhitelist builds a whitelist from a comma-separated IMEI list. required
// governs the empty-list behaviour: true => replay nothing, false => replay all.
func NewWhitelist(csv string, required bool) Whitelist {
	set := make(map[string]struct{})
	for _, raw := range strings.Split(csv, ",") {
		imei := strings.TrimSpace(raw)
		if imei != "" {
			set[imei] = struct{}{}
		}
	}
	return Whitelist{set: set, required: required}
}

// Allows reports whether an IMEI should be loaded and replayed. An empty list
// means "nothing" when required, "everything" otherwise (§3.4).
func (w Whitelist) Allows(imei string) bool {
	if len(w.set) == 0 {
		return !w.required
	}
	_, ok := w.set[imei]
	return ok
}

// Size returns the number of explicitly listed IMEIs.
func (w Whitelist) Size() int { return len(w.set) }

// Empty reports whether the whitelist has no explicit entries.
func (w Whitelist) Empty() bool { return len(w.set) == 0 }

// IMEIs returns the explicitly listed IMEIs (order unspecified).
func (w Whitelist) IMEIs() []string {
	out := make([]string, 0, len(w.set))
	for imei := range w.set {
		out = append(out, imei)
	}
	return out
}

// FileName returns the daily file name for a date (§3.1).
func FileName(date time.Time) string {
	return filePrefix + date.UTC().Format(fileDate) + fileSuffix
}

// ParseFileDate extracts the calendar date (at 00:00:00 UTC) from a daily file
// name like raw_packets_2026-04-10.csv.gz. The leading directory is ignored.
func ParseFileDate(name string) (time.Time, error) {
	base := filepath.Base(name)
	if !strings.HasPrefix(base, filePrefix) || !strings.HasSuffix(base, fileSuffix) {
		return time.Time{}, fmt.Errorf("unexpected file name %q (want %s<YYYY-MM-DD>%s)", base, filePrefix, fileSuffix)
	}
	datePart := strings.TrimSuffix(strings.TrimPrefix(base, filePrefix), fileSuffix)
	d, err := time.ParseInLocation(fileDate, datePart, time.UTC)
	if err != nil {
		return time.Time{}, fmt.Errorf("bad date in file name %q: %w", base, err)
	}
	return d, nil
}

// LoadFile streams a gzipped CSV, filters rows against the whitelist BEFORE
// hex-decoding (§3.3), and groups surviving rows by IMEI. Only whitelisted
// devices are ever held in memory. Malformed rows are logged at warn and
// skipped; they never abort the day.
func LoadFile(path string, wl Whitelist, delim string) (map[string][]ReplayPacket, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open replay file: %w", err)
	}
	defer f.Close()

	gz, err := gzip.NewReader(f)
	if err != nil {
		return nil, fmt.Errorf("gzip reader: %w", err)
	}
	defer gz.Close()

	sc := bufio.NewScanner(gz)
	sc.Buffer(make([]byte, 0, 64*1024), scannerMaxLine)

	byDevice := make(map[string][]ReplayPacket)
	var line, skipped, kept int

	for sc.Scan() {
		line++
		row := sc.Text()
		if strings.TrimSpace(row) == "" {
			continue
		}

		cols := strings.SplitN(row, delim, 3)
		if len(cols) < 3 {
			skipped++
			logger.Warn("replay: malformed row (want 3 columns)", zap.String("file", path), zap.Int("line", line))
			continue
		}

		// 1. IMEI (column 2) as plain text.
		imei := strings.TrimSpace(cols[1])
		if imei == "" {
			skipped++
			logger.Warn("replay: empty IMEI", zap.String("file", path), zap.Int("line", line))
			continue
		}

		// 2. Whitelist check — before any decode or allocation (§3.3, §3.4).
		if !wl.Allows(imei) {
			continue
		}

		// 3. Timestamp (column 1).
		ts, err := time.ParseInLocation(happenedAtLayout, strings.TrimSpace(cols[0]), time.UTC)
		if err != nil {
			skipped++
			logger.Warn("replay: bad timestamp", zap.String("file", path), zap.Int("line", line), zap.String("value", cols[0]), zap.Error(err))
			continue
		}

		// 4. Hex-decode the packet (column 3) — only for whitelisted IMEIs.
		raw, err := hex.DecodeString(strings.TrimSpace(cols[2]))
		if err != nil {
			skipped++
			logger.Warn("replay: bad hex packet", zap.String("file", path), zap.Int("line", line), zap.String("imei", imei), zap.Error(err))
			continue
		}

		byDevice[imei] = append(byDevice[imei], ReplayPacket{IMEI: imei, HappenedAt: ts.UTC(), Raw: raw})
		kept++
	}

	if err := sc.Err(); err != nil {
		return nil, fmt.Errorf("scan replay file: %w", err)
	}

	logger.Info("replay: file loaded",
		zap.String("file", path),
		zap.Int("rows", line),
		zap.Int("kept", kept),
		zap.Int("skipped", skipped),
		zap.Int("devices", len(byDevice)),
	)

	return byDevice, nil
}

// LoadReplayDay loads a file, sorts each device's packets, and computes the
// whole-day offset against the activation midnight (§5.1 steps 2-4).
func LoadReplayDay(path string, fileDateUTC, activationMidnight time.Time, wl Whitelist, delim string) (*ReplayDay, error) {
	byDevice, err := LoadFile(path, wl, delim)
	if err != nil {
		return nil, err
	}
	SortByHappenedAt(byDevice)
	return &ReplayDay{
		FileDate: midnightUTC(fileDateUTC),
		Offset:   ComputeOffset(fileDateUTC, activationMidnight),
		ByDevice: byDevice,
	}, nil
}
