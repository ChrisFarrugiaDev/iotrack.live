package repository

import "github.com/jackc/pgx/v5/pgxpool"

// Repository aggregates every data-access repository. Nothing outside this
// package touches SQL directly. Grows an Asset and Telemetry repository in
// Step 5; Access arrives early because Step 4's permission check needs it.
type Repository struct {
	Access *AccessRepository
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{
		Access: NewAccessRepository(pool),
	}
}
