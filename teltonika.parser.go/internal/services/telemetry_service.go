package services

import (
	"go.uber.org/zap"
	"iotrack.live/internal/apptypes"
	"iotrack.live/internal/logger"
)

// UpdateLastTelemetry merges non-zero fields and elements from telemetry into the device's record, creating it if missing.
func (s *Service) UpdateLastTelemetry(deviceID string, telemetry apptypes.FlatAvlRecord) {
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
	if telemetry.Timestamp != "" {
		merged.Timestamp = telemetry.Timestamp
	}
	if telemetry.Priority != 0 {
		merged.Priority = telemetry.Priority
	}
	if telemetry.Longitude != 0 {
		merged.Longitude = telemetry.Longitude
	}
	if telemetry.Latitude != 0 {
		merged.Latitude = telemetry.Latitude
	}
	if telemetry.Altitude != 0 {
		merged.Altitude = telemetry.Altitude
	}
	if telemetry.Angle != 0 {
		merged.Angle = telemetry.Angle
	}
	if telemetry.Satellites != 0 {
		merged.Satellites = telemetry.Satellites
	}
	if telemetry.Speed != 0 {
		merged.Speed = telemetry.Speed
	}

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
	var processSet map[string]struct{}
	if s.App.ActiveList == "A" {
		s.App.ActiveList = "B"
		processSet = s.App.UpdatedDevicesSetA
		s.App.UpdatedDevicesSetA = make(map[string]struct{}) // Reset A to empty
	} else {
		s.App.ActiveList = "A"
		processSet = s.App.UpdatedDevicesSetB
		s.App.UpdatedDevicesSetB = make(map[string]struct{}) // Reset B to empty
	}
	s.App.LatestTelemetryLock.Unlock()

	// Prepare a slice to track updated device IDs
	deviceIDs := make([]string, 0, len(processSet))
	for deviceID := range processSet {
		lt := s.App.LastTelemetryMap[deviceID]

		// Save latest telemetry to Redis with no expiration (-1 means persist)
		err := s.App.Cache.Set("device-latest-telemetry:"+deviceID, lt, -1)
		if err != nil {
			logger.Error("Failed to cache latest telemetry for device", zap.String("device_id", deviceID), zap.Error(err))
		}

		deviceIDs = append(deviceIDs, deviceID)
	}

	// Update the Redis set of all known device IDs (for lookups/enumeration)
	if len(deviceIDs) > 0 {
		err := s.App.Cache.SAddLua("device-latest-telemetry:id", deviceIDs...)
		if err != nil {
			logger.Error("Failed to update Redis set of device IDs", zap.Error(err))
		}
	}
}
