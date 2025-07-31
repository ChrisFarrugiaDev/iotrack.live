package services

import (
	"encoding/json"
	"fmt"

	"go.uber.org/zap"
	"iotrack.live/internal/appcore"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/models"
)

type DeviceService struct {
	App *appcore.App
}

func NewDeviceService(app *appcore.App) *DeviceService {
	return &DeviceService{
		App: app,
	}
}

func (s *DeviceService) SyncDevicesFromDBToRedis() error {
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

func (s *DeviceService) SyncDevicesFromRedisToVar() error {
	items, err := s.App.Cache.HGetAll("devices")
	if err != nil {
		logger.Error("failed to fetch devices from Redis", zap.Error(err))
		return fmt.Errorf("failed to fetch devices from Redis: %w", err)
	}

	devices := make(map[string]*models.Device)
	var unmarshallErrCount int

	for deviceID, jsonItem := range items {
		var d models.Device
		if err := json.Unmarshal([]byte(jsonItem), &d); err != nil {
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
