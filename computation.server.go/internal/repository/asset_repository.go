package repository

import (
	"context"
	"fmt"

	up "github.com/upper/db/v4"

	"iotrack.live/computation.server.go/internal/models"
)

// AssetRepository reads app.assets. A find-by-key like GetByUUID is exactly
// the shape upper/db reads well for, so this repository uses it — see
// repository.go for why the other repositories don't.
type AssetRepository struct {
	sess up.Session
}

func NewAssetRepository(sess up.Session) *AssetRepository {
	return &AssetRepository{sess: sess}
}

// GetByUUID looks up an asset by its public UUID — the wire contract only
// ever carries the UUID, never the internal bigint id (design doc §19.2).
// Returns an error wrapping db.ErrNoMoreRows when no asset matches.
func (r *AssetRepository) GetByUUID(ctx context.Context, uuid string) (*models.Asset, error) {
	var a models.Asset

	// WithContext binds this call to the request context, so it cancels if
	// the caller disconnects — a bare r.sess.Collection(...) would not.
	err := r.sess.WithContext(ctx).
		Collection("app.assets").
		Find(up.Cond{"uuid": uuid}).
		One(&a)
	if err != nil {
		return nil, fmt.Errorf("getting asset by uuid %s: %w", uuid, err)
	}

	return &a, nil
}
