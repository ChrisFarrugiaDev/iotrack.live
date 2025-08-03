package services

import (
	"iotrack.live/internal/apptypes"
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
func (s *Service) FlushLastTelemetry() {

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

	for deviceID := range processSet {

		lt := s.App.LastTelemetryMap[deviceID]

		// msgBytes, err := json.Marshal(lt)
		// if err != nil {
		// 	logger.Debug("Failed to marshal telemetry message", zap.Error(err))
		// 	return
		// }

		s.App.Cache.Set("device-latest-telemetry:"+deviceID, lt, -1)
	}

}
