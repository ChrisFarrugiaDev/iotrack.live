package repository

import (
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	up "github.com/upper/db/v4"
	"github.com/upper/db/v4/adapter/postgresql"
)

// Repository aggregates every data-access repository. Nothing outside this
// package touches SQL directly.
//
// Most repositories use raw pgx — the telemetry range scan needs full
// control over the SQL (ORDER BY, hypertable-aware WHERE), and the access
// checks are COALESCE/EXISTS queries that read no better through a query
// builder. Asset's GetByUUID is the exception: a plain find-by-key reads
// well through upper/db, so one upper session is built here alongside the
// pgx pool — the same dual setup teltonika.parser.go has always run. Every
// upper call must go through Session.WithContext per request; a bare
// sess.Collection(...) call silently drops the context and its cancellation.
type Repository struct {
	// Pool is exposed for the rare one-off query that doesn't warrant its
	// own repository method (e.g. test setup). Application code should
	// still prefer a named method on the relevant repository.
	Pool *pgxpool.Pool

	Access    *AccessRepository
	Asset     *AssetRepository
	Telemetry *TelemetryRepository
}

func NewRepository(pool *pgxpool.Pool) (*Repository, error) {
	// Set upper/db logging to Error only for cleaner logs (levels: Trace,
	// Debug, Info, Warn, Error, Fatal, Panic).
	up.LC().SetLevel(up.LogLevelError)

	stdDB := stdlib.OpenDB(*pool.Config().ConnConfig)
	sess, err := postgresql.New(stdDB)
	if err != nil {
		return nil, fmt.Errorf("opening upper/db session: %w", err)
	}

	return &Repository{
		Pool:      pool,
		Access:    NewAccessRepository(pool),
		Asset:     NewAssetRepository(sess),
		Telemetry: NewTelemetryRepository(pool),
	}, nil
}
