package models

import (
	"fmt"
	"time"
)

type Telemetry struct {
	ID             int64                  `db:"id,omitempty" json:"id"`
	DeviceID       int64                  `db:"device_id" json:"device_id"`
	AssetID        int64                  `db:"asset_id,omitempty" json:"asset_id"`
	OrganisationID int64                  `db:"organisation_id,omitempty" json:"organisation_id"`
	HappenedAt     time.Time              `db:"happened_at" json:"happened_at"`
	Protocol       string                 `db:"protocol" json:"protocol"`
	Vendor         *string                `db:"vendor" json:"vendor"`
	Model          *string                `db:"model,omitempty" json:"model,omitempty"`
	Telemetry      map[string]interface{} `db:"telemetry,omitempty" json:"telemetry,omitempty"`
	CreatedAt      time.Time              `db:"created_at" json:"created_at"`
}

func (m *Telemetry) TableName() string {
	return "app.telemetry"
}

func (m *Telemetry) GetByID(id int64) (*Telemetry, error) {
	t := Telemetry{}

	collection := upperSession.Collection(m.TableName())
	err := collection.Find("id =", id).One(&t)
	if err != nil {
		return nil, fmt.Errorf("failed to get telemetry by id %d: %w", id, err)
	}

	return &t, nil
}
