package repository

import (
	"context"
	"errors"
	"fmt"

	up "github.com/upper/db/v4"

	"iotrack.live/computation.server.go/internal/models"
)

// ErrNotFound is returned (wrapped) when a lookup matches no row. Callers
// test with errors.Is — it exists so the services layer can tell "does not
// exist" from a real failure without importing driver error types.
var ErrNotFound = errors.New("not found")

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
// Returns an error wrapping ErrNotFound when no asset matches.
func (r *AssetRepository) GetByUUID(ctx context.Context, uuid string) (*models.Asset, error) {
	var a models.Asset

	// WithContext binds this call to the request context, so it cancels if
	// the caller disconnects — a bare r.sess.Collection(...) would not.
	err := r.sess.WithContext(ctx).
		Collection("app.assets").
		Find(up.Cond{"uuid": uuid}).
		One(&a)
	if errors.Is(err, up.ErrNoMoreRows) {
		return nil, fmt.Errorf("asset %s: %w", uuid, ErrNotFound)
	}
	if err != nil {
		return nil, fmt.Errorf("getting asset by uuid %s: %w", uuid, err)
	}

	return &a, nil
}
