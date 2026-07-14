package models

import "time"

// Telemetry mirrors a row of app.telemetry. Data shape only — no query
// methods here; see internal/repository/telemetry_repository.go.
type Telemetry struct {
	ID             int64                  `db:"id" json:"id"`
	DeviceID       int64                  `db:"device_id" json:"device_id"`
	AssetID        int64                  `db:"asset_id" json:"asset_id"`
	OrganisationID int64                  `db:"organisation_id" json:"organisation_id"`
	HappenedAt     time.Time              `db:"happened_at" json:"happened_at"`
	Protocol       string                 `db:"protocol" json:"protocol"`
	Vendor         *string                `db:"vendor" json:"vendor"`
	Model          *string                `db:"model" json:"model,omitempty"`
	Telemetry      map[string]interface{} `db:"telemetry" json:"telemetry,omitempty"`
	CreatedAt      time.Time              `db:"created_at" json:"created_at"`
}
