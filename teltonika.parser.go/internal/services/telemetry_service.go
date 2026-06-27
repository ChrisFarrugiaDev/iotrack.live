package services

import (
	"fmt"
	"maps"

	"go.uber.org/zap"
	"iotrack.live/teltonika.parser.go/internal/apptypes"
	"iotrack.live/teltonika.parser.go/internal/logger"
)

// UpdateLastTelemetry merges non-zero fields and elements from telemetry into the device's record, creating it if missing.
func (s *Service) UpdateLastTelemetry(deviceID int64, telemetry apptypes.FlatAvlRecord) {
	s.App.LatestTelemetryLock.Lock()
	defer s.App.LatestTelemetryLock.Unlock()

	// Fetch previous telemetry record, or create empty if none exists
	old, exists := s.App.LastTelemetryMap[deviceID]

	// Ignore update if previous timestamp is newer or same
	if exists && old.Timestamp >= telemetry.Timestamp {
		return
	}

	if !exists {
		old = apptypes.FlatAvlRecord{}
	}

	merged := old

	// Only update fields if the new value is non-zero/non-empty
	merged.Timestamp = telemetry.Timestamp
	merged.Priority = telemetry.Priority

	if telemetry.Latitude != 0 && telemetry.Longitude != 0 {
		merged.Latitude = telemetry.Latitude
		merged.Longitude = telemetry.Longitude
	}

	merged.Altitude = telemetry.Altitude
	merged.Angle = telemetry.Angle
	merged.Satellites = telemetry.Satellites
	merged.Speed = telemetry.Speed

	// Merge 'Elements' map key-by-key; initialize if needed
	if merged.Elements == nil {
		merged.Elements = make(map[string]any)
	}
	maps.Copy(merged.Elements, telemetry.Elements)

	// Save updated telemetry record
	s.App.LastTelemetryMap[deviceID] = merged

	// Mark device as updated in the active set (A/B double-buffering)
	if s.App.ActiveList == "A" {
		s.App.UpdatedDevicesSetA[deviceID] = struct{}{}
	} else {
		s.App.UpdatedDevicesSetB[deviceID] = struct{}{}
	}
}

// ---------------------------------------------------------------------
// FlushLastTelemetry stores the latest telemetry for updated devices in Redis.
// Uses double-buffered A/B sets for concurrency safety.
func (s *Service) FlushLastTelemetry() {
	// Lock, swap the active set, and snapshot telemetry for the affected devices.
	// Snapshot must happen under the lock to avoid a race with UpdateLastTelemetry writers.
	s.App.LatestTelemetryLock.Lock()
	var processSet map[int64]struct{}
	if s.App.ActiveList == "A" {
		s.App.ActiveList = "B"
		processSet = s.App.UpdatedDevicesSetA
		s.App.UpdatedDevicesSetA = make(map[int64]struct{}) // Reset A to empty
	} else {
		s.App.ActiveList = "A"
		processSet = s.App.UpdatedDevicesSetB
		s.App.UpdatedDevicesSetB = make(map[int64]struct{}) // Reset B to empty
	}
	// Deep-copy the telemetry for each updated device while still holding the lock.
	// DeepCopy is required because FlatAvlRecord.Elements is a map (reference type) —
	// a plain struct copy would share the pointer, letting a concurrent UpdateLastTelemetry
	// mutate Elements while Cache.Set is JSON-marshalling it below (outside the lock).
	snapshot := make(map[int64]apptypes.FlatAvlRecord, len(processSet))
	for deviceID := range processSet {
		snapshot[deviceID] = s.App.LastTelemetryMap[deviceID].DeepCopy()
	}
	s.App.LatestTelemetryLock.Unlock()

	// Iterate the snapshot outside the lock — safe, no concurrent writers can touch it.
	deviceIDs := make([]int64, 0, len(snapshot))
	for deviceID, lt := range snapshot {

		// Save latest telemetry to Redis with no expiration (-1 means persist)
		err := s.App.Cache.Set(fmt.Sprintf("device-latest-telemetry:%d", deviceID), lt, -1)
		if err != nil {
			logger.Error("Failed to cache latest telemetry for device", zap.Int64("device_id", deviceID), zap.Error(err))
		}

		deviceIDs = append(deviceIDs, deviceID)
	}

	// Update the Redis set of all known device IDs (for lookups/enumeration)
	if len(deviceIDs) > 0 {
		deviceIDsStr := []string{}

		for _, id := range deviceIDs {
			deviceIDsStr = append(deviceIDsStr, fmt.Sprintf("%d", id))
		}

		err := s.App.Cache.SAddLua("device-latest-telemetry:id", deviceIDsStr...)
		if err != nil {
			logger.Error("Failed to update Redis set of device IDs", zap.Error(err))
		}
	}
}
