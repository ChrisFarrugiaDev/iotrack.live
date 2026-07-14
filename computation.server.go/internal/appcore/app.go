package appcore

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"iotrack.live/computation.server.go/internal/repository"
)

type App struct {
	DB   *pgxpool.Pool
	Repo *repository.Repository

	// Read once at boot; main refuses to start without it.
	JWTSecret []byte
}
