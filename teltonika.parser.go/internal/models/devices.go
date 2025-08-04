package models

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

const (
	DeviceStatusNew      = "new"
	DeviceStatusActive   = "active"
	DeviceStatusDisabled = "disabled"
	DeviceStatusRetired  = "retired"
)

type Device struct {
	ID              int64                  `db:"id,omitempty" json:"id"`
	UUID            string                 `db:"uuid" json:"uuid"`
	OrganisationID  int64                  `db:"organisation_id,omitempty" json:"organisation_id"`
	AssetID         *int64                 `db:"asset_id,omitempty" json:"asset_id"`
	ExternalID      string                 `db:"external_id" json:"external_id"`
	ExternalIDType  string                 `db:"external_id_type" json:"external_id_type"`
	Protocol        string                 `db:"protocol" json:"protocol"`
	Vendor          *string                `db:"vendor" json:"vendor"`
	Model           *string                `db:"model" json:"model"`
	Status          string                 `db:"status" json:"status"` // ENUM: 'new', 'active', etc.
	Attributes      map[string]interface{} `db:"attributes,omitempty" json:"attributes,omitempty"`
	LastTelemetry   map[string]interface{} `db:"last_telemetry,omitempty" json:"last_telemetry,omitempty"`
	LastTelemetryTs time.Time              `db:"last_telemetry_ts,omitempty" json:"last_telemetry_ts,omitempty"`
	Created_at      time.Time              `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time              `db:"updated_at" json:"updated_at"`
}

// TableName returns the full table name for the Device model.
func (Device) TableName() string {
	return "app.devices"
}

func (m *Device) GetAllDevices() ([]*Device, error) {
	var devices []*Device
	collection := upperSession.Collection(m.TableName())
	err := collection.Find("vendor =", "teltonika").All(&devices)

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve devices from database: %w", err)
	}

	return devices, nil
}

func (m *Device) Create(newDevice *Device) (*Device, error) {
	collection := upperSession.Collection(m.TableName())

	now := time.Now().UTC()

	newDevice.Created_at = now
	newDevice.UpdatedAt = now

	err := collection.InsertReturning(newDevice)
	if err != nil {
		// Check if the error is a duplicate key violation (PostgreSQL SQL state 23505)
		if strings.Contains(err.Error(), "SQLSTATE 23505") {
			// Define a custom error for duplicate device entries
			var ErrDuplicateDevice = errors.New("device with this IMEI already exists")
			return nil, ErrDuplicateDevice
		}
		// Return any other errors with additional context
		return nil, fmt.Errorf("failed to create device: %w", err)
	}

	return newDevice, nil
}
