package models

import (
	"fmt"
	"time"
)

type Organisation struct {
	ID            string                 `db:"id" json:"id"`
	UUID          string                 `db:"uuid" json:"uuid"`
	Name          string                 `db:"name" json:"name"`
	ParentOrgID   *string                `db:"parent_org_id" json:"parent_org_id,omitempty"`
	Path          string                 `db:"path" json:"path"`
	MapsAPIKey    *string                `db:"maps_api_key" json:"maps_api_key,omitempty"`
	CanInheritKey bool                   `db:"can_inherit_key" json:"can_inherit_key"`
	Attributes    map[string]interface{} `db:"attributes" json:"attributes"`
	CreatedAt     time.Time              `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time              `db:"updated_at" json:"updated_at"`
}

func (m *Organisation) TableName() string {
	return "app.organisations"
}

func (m *Organisation) GetAll() ([]*Organisation, error) {
	var organisation []*Organisation
	collection := upperSession.Collection(m.TableName())
	err := collection.Find().All(&organisation)

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve organisations from database: %w", err)
	}

	return organisation, nil
}
