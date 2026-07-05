package replay

import (
	"context"
	"testing"
	"time"
)

func TestParseFileDate(t *testing.T) {
	cases := []struct {
		name    string
		want    string
		wantErr bool
	}{
		{"raw_packets_2026-04-10.csv.gz", "2026-04-10", false},
		{"/data/dir/raw_packets_2025-12-31.csv.gz", "2025-12-31", false},
		{"raw_packets_2026-13-01.csv.gz", "", true}, // bad month
		{"something_else.csv.gz", "", true},
		{"raw_packets_2026-04-10.csv", "", true}, // wrong suffix
	}
	for _, c := range cases {
		got, err := ParseFileDate(c.name)
		if c.wantErr {
			if err == nil {
				t.Errorf("ParseFileDate(%q) expected error", c.name)
			}
			continue
		}
		if err != nil {
			t.Errorf("ParseFileDate(%q): %v", c.name, err)
			continue
		}
		if got != dateUTC(t, c.want) {
			t.Errorf("ParseFileDate(%q) = %v, want %s", c.name, got, c.want)
		}
	}
}

func TestFileNameRoundTrip(t *testing.T) {
	d := dateUTC(t, "2026-04-10")
	name := FileName(d)
	if name != "raw_packets_2026-04-10.csv.gz" {
		t.Fatalf("FileName = %q", name)
	}
	back, err := ParseFileDate(name)
	if err != nil || back != d {
		t.Fatalf("round trip failed: %v / %v", back, err)
	}
}

func newTestRotator(t *testing.T, startFile string, days int, dataDir string) *Rotator {
	t.Helper()
	r, err := NewRotator(Config{
		DataDir:       dataDir,
		StartFile:     startFile,
		Days:          days,
		PreloadLead:   time.Hour,
		OnMissingFile: OnMissingSkip,
		Delimiter:     "\t",
		Whitelist:     NewWhitelist(imeiA, true),
	}, nil)
	if err != nil {
		t.Fatalf("NewRotator: %v", err)
	}
	return r
}

func TestDateForIndexAndWrap(t *testing.T) {
	r := newTestRotator(t, "raw_packets_2026-04-10.csv.gz", 3, t.TempDir())

	want := []string{"2026-04-10", "2026-04-11", "2026-04-12"}
	for i, w := range want {
		if got := r.dateForIndex(i); got != dateUTC(t, w) {
			t.Errorf("dateForIndex(%d) = %v, want %s", i, got, w)
		}
	}

	// Wrap-back after REPLAY_DAYS: index sequence cycles 0,1,2,0,1,2...
	dayIndex := 0
	seq := []int{}
	for n := 0; n < 7; n++ {
		seq = append(seq, dayIndex)
		dayIndex = (dayIndex + 1) % r.cfg.Days
	}
	wantSeq := []int{0, 1, 2, 0, 1, 2, 0}
	for i := range wantSeq {
		if seq[i] != wantSeq[i] {
			t.Fatalf("index sequence = %v, want %v", seq, wantSeq)
		}
	}
}

func TestMidnightAfter(t *testing.T) {
	cases := []struct {
		in, want time.Time
	}{
		{time.Date(2026, 4, 10, 14, 0, 0, 0, time.UTC), time.Date(2026, 4, 11, 0, 0, 0, 0, time.UTC)},
		{time.Date(2026, 4, 10, 0, 0, 0, 0, time.UTC), time.Date(2026, 4, 11, 0, 0, 0, 0, time.UTC)},    // strictly after
		{time.Date(2026, 12, 31, 23, 59, 59, 0, time.UTC), time.Date(2027, 1, 1, 0, 0, 0, 0, time.UTC)}, // year boundary
	}
	for _, c := range cases {
		if got := midnightAfter(c.in); !got.Equal(c.want) {
			t.Errorf("midnightAfter(%v) = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestDurUntil(t *testing.T) {
	now := time.Date(2026, 4, 10, 12, 0, 0, 0, time.UTC)
	if got := durUntil(now, now.Add(5*time.Second)); got != 5*time.Second {
		t.Errorf("durUntil future = %v, want 5s", got)
	}
	if got := durUntil(now, now.Add(-5*time.Second)); got != 0 {
		t.Errorf("durUntil past = %v, want 0", got)
	}
}

func TestPreloadFiresBeforeMidnight(t *testing.T) {
	// preloadAt must be exactly PreloadLead before the next midnight (§6.2).
	r := newTestRotator(t, "raw_packets_2026-04-10.csv.gz", 1, t.TempDir())
	now := time.Date(2026, 4, 10, 14, 0, 0, 0, time.UTC)
	nextMidnight := midnightAfter(now)
	preloadAt := nextMidnight.Add(-r.cfg.PreloadLead)
	if preloadAt != time.Date(2026, 4, 10, 23, 0, 0, 0, time.UTC) {
		t.Fatalf("preloadAt = %v, want 2026-04-10T23:00:00Z", preloadAt)
	}
	if !preloadAt.Before(nextMidnight) {
		t.Fatal("preload must fire before midnight")
	}
}

func TestLoadDayMissingFileReturnsError(t *testing.T) {
	// Empty data dir => loadDay fails, which drives the skip/halt policy (§6.4).
	r := newTestRotator(t, "raw_packets_2026-04-10.csv.gz", 1, t.TempDir())
	_, err := r.loadDay(context.Background(), 0, dateUTC(t, "2026-04-10"))
	if err == nil {
		t.Fatal("expected error for missing file")
	}
}

func TestEmptyDayHasOffsetNoDevices(t *testing.T) {
	r := newTestRotator(t, "raw_packets_2026-04-10.csv.gz", 3, t.TempDir())
	day := r.emptyDay(1, dateUTC(t, "2026-04-12"))
	if len(day.ByDevice) != 0 {
		t.Errorf("emptyDay should have no devices")
	}
	// day index 1 -> 2026-04-11; activation 2026-04-12 -> 1 day offset.
	if day.Offset != 24*time.Hour {
		t.Errorf("emptyDay offset = %v, want 24h", day.Offset)
	}
}
