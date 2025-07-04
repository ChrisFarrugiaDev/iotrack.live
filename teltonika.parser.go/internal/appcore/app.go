package appcore

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
	"iotrack.live/internal/cache"
	"iotrack.live/internal/models"
	"iotrack.live/internal/rabbitmq"
)

type App struct {
	Cache      *cache.RedisCache
	MQProducer *rabbitmq.RabbitMQProducer
	Log        *zap.Logger
	DB         *pgxpool.Pool
	Models     models.Models
}
