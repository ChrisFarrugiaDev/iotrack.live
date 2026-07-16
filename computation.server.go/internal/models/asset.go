package models

// Asset mirrors a row of app.assets. Data shape only — no query methods
// here; see internal/repository/asset_repository.go.
type Asset struct {
	ID             int64   `db:"id" json:"id"`
	UUID           string  `db:"uuid" json:"uuid"`
	OrganisationID int64   `db:"organisation_id" json:"organisation_id"`
	Name           string  `db:"name" json:"name"`
	AssetType      *string `db:"asset_type" json:"asset_type"`
}
