package services

import (
	"fmt"

	"go.uber.org/zap"
	"iotrack.live/internal/apptypes"
	"iotrack.live/internal/logger"
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

	if telemetry.Longitude > 0 {
		merged.Longitude = telemetry.Longitude
	}
	if telemetry.Latitude > 0 {
		merged.Latitude = telemetry.Latitude
	}
	merged.Altitude = telemetry.Altitude
	merged.Angle = telemetry.Angle
	merged.Satellites = telemetry.Satellites
	merged.Speed = telemetry.Speed

	// Merge 'Elements' map key-by-key; initialize if needed
	if merged.Elements == nil {
		merged.Elements = make(map[string]any)
	}
	for k, v := range telemetry.Elements {
		merged.Elements[k] = v
	}

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
	// Lock and swap the active set
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
	s.App.LatestTelemetryLock.Unlock()

	// Prepare a slice to track updated device IDs
	deviceIDs := make([]int64, 0, len(processSet))
	for deviceID := range processSet {
		lt := s.App.LastTelemetryMap[deviceID]

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
