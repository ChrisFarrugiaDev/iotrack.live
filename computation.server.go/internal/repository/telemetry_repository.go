package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"iotrack.live/computation.server.go/internal/models"
)

// TelemetryRepository reads app.telemetry, a TimescaleDB hypertable
// partitioned on happened_at.
type TelemetryRepository struct {
	pool *pgxpool.Pool
}

func NewTelemetryRepository(pool *pgxpool.Pool) *TelemetryRepository {
	return &TelemetryRepository{pool: pool}
}

// RangeByAsset returns telemetry for one asset within [from, to], oldest
// first (design doc §29). Always by asset_id, never by a device's current
// device_id — a device can be reassigned between assets, and each row
// records the assignment that was current at ingestion time (§45).
func (r *TelemetryRepository) RangeByAsset(ctx context.Context, assetID int64, from, to time.Time) ([]models.Telemetry, error) {
	const query = `
		SELECT id, device_id, asset_id, organisation_id, happened_at,
		       protocol, vendor, model, telemetry, created_at
		  FROM app.telemetry
		 WHERE asset_id = $1
		   AND happened_at BETWEEN $2 AND $3
		 ORDER BY happened_at ASC`

	rows, err := r.pool.Query(ctx, query, assetID, from, to)
	if err != nil {
		return nil, fmt.Errorf("querying telemetry range for asset %d: %w", assetID, err)
	}
	defer rows.Close()

	points, err := pgx.CollectRows(rows, pgx.RowToStructByNameLax[models.Telemetry])
	if err != nil {
		return nil, fmt.Errorf("reading telemetry range for asset %d: %w", assetID, err)
	}

	return points, nil
}
