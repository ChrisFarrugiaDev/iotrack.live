package appcore

import (
	"github.com/GoWebProd/uuid7"
	"github.com/jackc/pgx/v5/pgxpool"

	"iotrack.live/file.server.go/internal/models"
)

type App struct {
	UUID   *uuid7.Generator
	DB     *pgxpool.Pool
	Models models.Models
}
