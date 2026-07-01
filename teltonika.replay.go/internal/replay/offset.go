package replay

import (
	"strconv"
	"time"

	"iotrack.live/teltonika.replay.go/internal/apptypes"
)

// midnightUTC returns t truncated to 00:00:00 UTC of its calendar date.
func midnightUTC(t time.Time) time.Time {
	u := t.UTC()
	return time.Date(u.Year(), u.Month(), u.Day(), 0, 0, 0, 0, time.UTC)
}

// ComputeOffset returns the whole-day, midnight-anchored offset for a file
// (§4.1): activationMidnight - fileDate, both normalised to 00:00:00 UTC.
//
// activationMidnight is the UTC midnight at which the day becomes active — for
// the first (boot) day that is today's midnight; for a preloaded day it is the
// upcoming midnight tick at which it will be switched in (§6.2). Anchoring on
// the activation midnight keeps every packet's time-of-day intact and lands the
// day on the correct calendar day.
func ComputeOffset(fileDate, activationMidnight time.Time) time.Duration {
	return midnightUTC(activationMidnight).Sub(midnightUTC(fileDate))
}

// ApplyOffset shifts a parsed AVL record's timestamps by offset in place
// (Strategy A, §4.3): the raw bytes are never mutated, so CRC stays valid.
// Both the RFC3339 HappenedAt string and the Unix-seconds Timestamp string are
// rederived from the adjusted instant, matching the parser's output format.
func ApplyOffset(avl *apptypes.AvlData, offset time.Duration) error {
	t, err := time.Parse(time.RFC3339Nano, avl.HappenedAt)
	if err != nil {
		return err
	}
	adj := t.Add(offset).UTC()
	avl.HappenedAt = adj.Format(time.RFC3339Nano)
	avl.Timestamp = strconv.FormatInt(adj.Unix(), 10)
	return nil
}
