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

type AppDevice struct {
	ID               int64     `db:"id" json:"id"`
	UUID             string    `db:"uuid" json:"uuid"`
	OrganisationID   int64     `db:"organisation_id,omitempty" json:"organisation_id"`
	OrganisationUUID string    `db:"organisation_uuid,omitempty" json:"organisation_uuid"`
	AssetID          *int64    `db:"asset_id,omitempty" json:"asset_id"`
	AssetUUID        *string   `db:"asset_uuid,omitempty"  json:"asset_uuid"`
	ExternalID       string    `db:"external_id" json:"external_id"`
	ExternalIDType   string    `db:"external_id_type" json:"external_id_type"`
	Protocol         string    `db:"protocol" json:"protocol"`
	Vendor           *string   `db:"vendor" json:"vendor"`
	Model            *string   `db:"model" json:"model"`
	Status           string    `db:"status" json:"status"` // ENUM: 'new', 'active', etc.
	Description      *string   `db:"description" json:"description"`
	RegisteredAt     time.Time `db:"registered_at" json:"registered_at"`
	UpdatedAt        time.Time `db:"updated_at" json:"updated_at"`
}

// TableName returns the full table name for the AppDevice model.
func (AppDevice) TableName() string {
	return "app.devices"
}

func (m *AppDevice) GetAllDevices() ([]*AppDevice, error) {
	var appDevices []*AppDevice
	collection := upperSession.Collection(m.TableName())
	err := collection.Find("vendor =", "teltonika").All(&appDevices)

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve devices from database: %w", err)
	}

	return appDevices, nil
}

func (m *AppDevice) Create(newDevice *AppDevice) (*AppDevice, error) {
	collection := upperSession.Collection(m.TableName())

	now := time.Now().UTC()

	newDevice.RegisteredAt = now
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
