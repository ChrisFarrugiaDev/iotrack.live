package appcore

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"iotrack.live/computation.server.go/internal/models"
)

type App struct {
	DB     *pgxpool.Pool
	Models models.Models
}
