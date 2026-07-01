package replay

import (
	"testing"
	"time"

	"iotrack.live/teltonika.replay.go/internal/apptypes"
)

func TestComputeOffsetSpecExample(t *testing.T) {
	// §4.1 / §17: 2025-08-15 -> 2026-07-27 is 346 days = 29,894,400s.
	// (The spec's original "316 days / 27,302,400s" figure was a miscalculation;
	// the real delta is 346 days. The whole-day, midnight-anchored behaviour is
	// unchanged — only the illustrative number was wrong.)
	got := ComputeOffset(dateUTC(t, "2025-08-15"), dateUTC(t, "2026-07-27"))
	want := 29894400 * time.Second
	if got != want {
		t.Fatalf("offset = %v, want %v", got, want)
	}
}

func TestComputeOffsetWholeDayCases(t *testing.T) {
	cases := []struct {
		file, activation string
		wantDays         int
	}{
		{"2026-04-10", "2026-04-10", 0}, // same day
		{"2026-04-10", "2026-04-11", 1}, // next day
		{"2026-01-31", "2026-02-01", 1}, // month boundary
		{"2025-12-31", "2026-01-01", 1}, // year boundary
		{"2024-02-28", "2024-03-01", 2}, // leap-year February
		{"2025-08-15", "2026-07-27", 346},
	}
	for _, c := range cases {
		got := ComputeOffset(dateUTC(t, c.file), dateUTC(t, c.activation))
		want := time.Duration(c.wantDays) * 24 * time.Hour
		if got != want {
			t.Errorf("ComputeOffset(%s, %s) = %v, want %v", c.file, c.activation, got, want)
		}
	}
}

func TestComputeOffsetNormalisesActivationToMidnight(t *testing.T) {
	// A non-midnight "now" must still yield a whole-day offset (§4 UTC, no DST).
	activation := time.Date(2026, 4, 11, 14, 37, 5, 0, time.UTC)
	got := ComputeOffset(dateUTC(t, "2026-04-10"), activation)
	if got != 24*time.Hour {
		t.Fatalf("offset = %v, want 24h", got)
	}
}

func TestApplyOffsetRewritesTimestamps(t *testing.T) {
	avl := &apptypes.AvlData{
		HappenedAt: "2019-06-10T10:04:46Z",
		Timestamp:  "1560161086",
	}
	if err := ApplyOffset(avl, 24*time.Hour); err != nil {
		t.Fatalf("ApplyOffset: %v", err)
	}
	if avl.HappenedAt != "2019-06-11T10:04:46Z" {
		t.Errorf("HappenedAt = %q, want 2019-06-11T10:04:46Z", avl.HappenedAt)
	}
	if avl.Timestamp != "1560247486" { // 1560161086 + 86400
		t.Errorf("Timestamp = %q, want 1560247486", avl.Timestamp)
	}
}

func TestApplyOffsetPreservesFractionalSeconds(t *testing.T) {
	avl := &apptypes.AvlData{HappenedAt: "2019-06-10T10:04:46.010Z", Timestamp: "1560161086"}
	if err := ApplyOffset(avl, 48*time.Hour); err != nil {
		t.Fatalf("ApplyOffset: %v", err)
	}
	if avl.HappenedAt != "2019-06-12T10:04:46.01Z" {
		t.Errorf("HappenedAt = %q, want 2019-06-12T10:04:46.01Z", avl.HappenedAt)
	}
}
