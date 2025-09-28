package models

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

type Image struct {
	ID             int64                  `db:"id,omitempty" json:"id"`
	UUID           string                 `db:"uuid" json:"uuid"`
	EntityType     string                 `db:"entity_type" json:"entity_type"`
	EntityID       int64                  `db:"entity_id" json:"entity_id"`
	Filename       string                 `db:"filename" json:"filename"`
	StoragePath    string                 `db:"storage_path" json:"storage_path"`
	URL            *string                `db:"url" json:"url,omitempty"` // nullable
	MimeType       string                 `db:"mime_type" json:"mime_type"`
	WidthPx        *int                   `db:"width_px" json:"width_px,omitempty"`
	HeightPx       *int                   `db:"height_px" json:"height_px,omitempty"`
	SizeBytes      *int64                 `db:"size_bytes" json:"size_bytes,omitempty"`
	Compressed     bool                   `db:"compressed" json:"compressed"`
	Encrypted      bool                   `db:"encrypted" json:"encrypted"`
	ChecksumSHA256 *string                `db:"checksum_sha256" json:"checksum_sha256,omitempty"`
	IsPrimary      bool                   `db:"is_primary" json:"is_primary"`
	Tags           []string               `db:"tags" json:"tags"`
	Attributes     map[string]interface{} `db:"attributes" json:"attributes"`

	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	UploadedBy *int64    `db:"uploaded_by" json:"uploaded_by,omitempty"` // nullable
}

// Optional: TableName method if your ORM uses it (sqlx, gorm, etc.)
func (Image) TableName() string {
	return "app.images"
}

func (img *Image) Create(newImage *Image) (*Image, error) {
	collection := upperSession.Collection(img.TableName())

	newImage.CreatedAt = time.Now().UTC()

	err := collection.InsertReturning(newImage)
	if err != nil {
		// Duplicate key error for PostgreSQL
		if strings.Contains(err.Error(), "SQLSTATE 23505") {
			var ErrDuplicateImage = errors.New("image with this UUID or id already exists")
			return nil, ErrDuplicateImage
		}
		return nil, fmt.Errorf("failed to create image: %w", err)
	}

	return newImage, nil
}

func (img *Image) GetByEntity(entityType string, entityId int64) ([]*Image, error) {
	images := []*Image{}
	collection := upperSession.Collection(img.TableName())

	err := collection.Find("entity_type", entityType).And("entity_id", entityId).All(images)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve images from database: %w", err)
	}

	return images, nil
}
