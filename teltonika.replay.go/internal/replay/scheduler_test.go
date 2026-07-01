package replay

import (
	"context"
	"encoding/hex"
	"testing"
	"time"

	"iotrack.live/teltonika.replay.go/internal/teltonika"
)

func TestScheduleDeviceOrderingAndMidDaySkip(t *testing.T) {
	now := time.Now()
	// Sorted ascending; offset 0 so HappenedAt == scheduled time.
	packets := []ReplayPacket{
		{IMEI: "x", HappenedAt: now.Add(-3 * time.Second)},       // past-due -> skip
		{IMEI: "x", HappenedAt: now.Add(-2 * time.Second)},       // past-due -> skip
		{IMEI: "x", HappenedAt: now.Add(60 * time.Millisecond)},  // fire
		{IMEI: "x", HappenedAt: now.Add(120 * time.Millisecond)}, // fire
	}

	var fired []time.Time
	scheduleDevice(context.Background(), packets, 0, func(p ReplayPacket) {
		fired = append(fired, p.HappenedAt)
	})

	if len(fired) != 2 {
		t.Fatalf("fired %d packets, want 2 (two past-due skipped)", len(fired))
	}
	if !fired[0].Equal(packets[2].HappenedAt) || !fired[1].Equal(packets[3].HappenedAt) {
		t.Fatalf("fired out of order: %v", fired)
	}
}

func TestScheduleDeviceGraceFiresNearMidnightPacket(t *testing.T) {
	now := time.Now()
	// A packet a fraction in the past (within fireGrace) must still fire — this
	// is the freshly-activated 00:00:00 packet at the midnight switch (§6.3).
	packets := []ReplayPacket{
		{IMEI: "x", HappenedAt: now.Add(-100 * time.Millisecond)},
	}
	var fired int
	scheduleDevice(context.Background(), packets, 0, func(ReplayPacket) { fired++ })
	if fired != 1 {
		t.Fatalf("fired %d, want 1 (within fireGrace)", fired)
	}
}

func TestScheduleDeviceContextCancel(t *testing.T) {
	now := time.Now()
	packets := []ReplayPacket{
		{IMEI: "x", HappenedAt: now.Add(10 * time.Second)},
		{IMEI: "x", HappenedAt: now.Add(20 * time.Second)},
	}

	ctx, cancel := context.WithCancel(context.Background())
	var fired int
	done := make(chan struct{})
	go func() {
		scheduleDevice(ctx, packets, 0, func(ReplayPacket) { fired++ })
		close(done)
	}()

	cancel()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("scheduleDevice did not return after context cancel")
	}
	if fired != 0 {
		t.Fatalf("fired %d, want 0 (cancelled before any packet was due)", fired)
	}
}

func TestValidCodec8CRC(t *testing.T) {
	raw, err := hex.DecodeString(officialCodec8Hex)
	if err != nil {
		t.Fatalf("decode hex: %v", err)
	}
	record, err := teltonika.ParseCodec8(raw)
	if err != nil {
		t.Fatalf("ParseCodec8: %v", err)
	}

	if !validCodec8CRC(raw, record.CRC) {
		t.Errorf("valid packet failed CRC check")
	}
	// uint32 -> uint16 truncation path: the parser stores CRC in the low 16 bits.
	if !validCodec8CRC(raw, 0xC7CF) {
		t.Errorf("CRC 0xC7CF should validate")
	}

	// Corrupt a byte in the data field -> CRC must fail.
	corrupt := make([]byte, len(raw))
	copy(corrupt, raw)
	corrupt[10] ^= 0xFF
	if validCodec8CRC(corrupt, record.CRC) {
		t.Errorf("corrupted packet passed CRC check")
	}
}
