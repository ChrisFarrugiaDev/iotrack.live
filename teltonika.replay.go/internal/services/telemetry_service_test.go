package services

import (
	"fmt"
	"sync"
	"testing"

	"iotrack.live/teltonika.replay.go/internal/appcore"
	"iotrack.live/teltonika.replay.go/internal/apptypes"
)

func newTestService() *Service {
	app := &appcore.App{
		LastTelemetryMap: make(map[int64]apptypes.FlatAvlRecord),
		UpdatedDevices:   make(map[int64]struct{}),
	}
	return NewService(app)
}

func TestUpdateLastTelemetry_merge(t *testing.T) {
	s := newTestService()

	first := apptypes.FlatAvlRecord{
		Timestamp: "2025-06-04T09:00:00.000Z",
		Speed:     30,
		Elements:  map[string]any{"ignition": 1},
	}
	s.UpdateLastTelemetry(1, first)

	got := s.App.LastTelemetryMap[1]
	if got.Speed != 30 || got.Elements["ignition"] != 1 {
		t.Fatalf("unexpected merge result: %+v", got)
	}
}

func TestUpdateLastTelemetry_rejectsOlderTimestamp(t *testing.T) {
	s := newTestService()

	newer := apptypes.FlatAvlRecord{Timestamp: "2025-06-04T09:01:00.000Z", Speed: 50}
	older := apptypes.FlatAvlRecord{Timestamp: "2025-06-04T09:00:00.000Z", Speed: 10}

	s.UpdateLastTelemetry(1, newer)
	s.UpdateLastTelemetry(1, older)

	if s.App.LastTelemetryMap[1].Speed != 50 {
		t.Error("older record should not overwrite a newer one")
	}
}

// TestUpdateLastTelemetry_concurrent exercises concurrent access under the race detector.
// Run with: go test -race ./internal/services
func TestUpdateLastTelemetry_concurrent(t *testing.T) {
	s := newTestService()
	const goroutines = 20

	var wg sync.WaitGroup
	wg.Add(goroutines)
	for i := range goroutines {
		go func(n int) {
			defer wg.Done()
			rec := apptypes.FlatAvlRecord{
				Timestamp: fmt.Sprintf("2025-06-04T09:%02d:00.000Z", n),
				Speed:     uint16(n * 5),
				Elements:  map[string]any{"io_1": n},
			}
			s.UpdateLastTelemetry(1, rec)
		}(i)
	}
	wg.Wait()
}
