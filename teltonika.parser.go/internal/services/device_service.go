package services

import (
	"encoding/json"
	"fmt"
	"strconv"

	"go.uber.org/zap"

	"iotrack.live/internal/logger"
	"iotrack.live/internal/models"
)

func (s *Service) SyncDevicesFromDBToRedis() error {
	// Fetch all devices from the database
	devices, err := s.App.Models.Device.GetAllDevices()
	if err != nil {
		logger.Error("failed to get devices from database", zap.Error(err))
		return fmt.Errorf("failed to get devices from database: %w", err)
	}

	// Map devices by ExternalID
	devicesMap := make(map[string]*models.Device)
	for _, d := range devices {
		devicesMap[d.ExternalID] = d
	}

	// Sync to Redis atomically
	err = s.App.Cache.ReplaceDeviceHashWithLua("devices", devicesMap)
	if err != nil {
		logger.Error("failed to replace devices hash in Redis", zap.Error(err))
		return fmt.Errorf("failed to replace devices hash in Redis: %w", err)
	}

	// Log a summary of the sync
	logger.Debug("Synced devices from DB to Redis",
		zap.Int("db_devices", len(devices)),
		zap.Int("redis_devices", len(devicesMap)),
		zap.String("redis_key", "devices"),
	)

	return nil
}

// ---------------------------------------------------------------------
// normalizeIDs ensures numeric fields (id, organisation_id, asset_id) are
// converted to int64 if they arrive as strings in JSON from Redis.
func normalizeIDs(jsonItem string) ([]byte, error) {
	var m map[string]any
	if err := json.Unmarshal([]byte(jsonItem), &m); err != nil {
		return nil, err
	}
	if s, ok := m["id"].(string); ok {
		if n, err := strconv.ParseInt(s, 10, 64); err == nil {
			m["id"] = n
		}
	}
	if s, ok := m["organisation_id"].(string); ok {
		if n, err := strconv.ParseInt(s, 10, 64); err == nil {
			m["organisation_id"] = n
		}
	}
	if s, ok := m["asset_id"].(string); ok {
		if n, err := strconv.ParseInt(s, 10, 64); err == nil {
			m["asset_id"] = n
		}
	}
	return json.Marshal(m)
}

func (s *Service) SyncDevicesFromRedisToVar() error {
	items, err := s.App.Cache.HGetAll("devices")
	if err != nil {
		logger.Error("failed to fetch devices from Redis", zap.Error(err))
		return fmt.Errorf("failed to fetch devices from Redis: %w", err)
	}

	devices := make(map[string]*models.Device)
	var unmarshallErrCount int

	for deviceID, jsonItem := range items {
		fixed, err := normalizeIDs(jsonItem)
		if err != nil {
			continue
		}
		var d models.Device
		if err := json.Unmarshal(fixed, &d); err != nil {
			logger.Error("failed to unmarshal device from Redis", zap.String("device_id", deviceID), zap.Error(err))
			unmarshallErrCount++
			continue
		}
		devices[deviceID] = &d
	}

	s.App.DevicesLock.Lock()
	s.App.Devices = devices
	s.App.DevicesLock.Unlock()

	logger.Debug("Devices cache loaded from Redis",
		zap.Int("total_devices", len(items)),
		zap.Int("loaded_devices", len(devices)),
		zap.Int("unmarshal_errors", unmarshallErrCount),
	)

	return nil
}

// ---------------------------------------------------------------------
