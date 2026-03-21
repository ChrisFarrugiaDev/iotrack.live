package models

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	up "github.com/upper/db/v4"
	"github.com/upper/db/v4/adapter/postgresql"
	// "github.com/upper/db/v4/adapter/postgresql"
)

// dbPool holds the global pgx connection pool for direct/advanced queries.
var dbPool *pgxpool.Pool

// upperSession holds the global Upper ORM session for high-level DB operations.
var upperSession up.Session

// Models will aggregate references to all DB model structs, e.g., Device, User, etc.
type Models struct {
	Telemetry Telemetry
}

// AppModels is a global instance for sharing initialized models.
var AppModels Models

func New(conn *pgxpool.Pool) (Models, error) {
	// Set upper/db logging to Error only for cleaner logs (levels: Trace, Debug, Info, Warn, Error, Fatal, Panic)
	up.LC().SetLevel(up.LogLevelError)

	// Store the pgxpool globally for raw queries or transactions if needed.
	dbPool = conn

	stdDB := stdlib.OpenDB(*dbPool.Config().ConnConfig)

	sess, err := postgresql.New(stdDB)
	if err != nil {
		return Models{}, err
	}

	// Store the ORM session globally.
	upperSession = sess

	// Prepare and return the aggregate Models struct.
	AppModels = Models{}
	return AppModels, nil
}

// ---------------------------------------------------------------------

// Session returns the current global Upper ORM session.
// Use this for ORM-based queries and transactions across your app.
func Session() up.Session {
	return upperSession
}

// Pool returns the current global pgxpool.Pool.
// Use this when you need low-level PostgreSQL operations or connection management.
func Pool() *pgxpool.Pool {
	return dbPool
}
