package appcore

import (
	"go.uber.org/zap"
	"iotrack.live/internal/cache"
	"iotrack.live/internal/rabbitmq"
)

type App struct {
	Cache      *cache.RedisCache
	MQProducer *rabbitmq.RabbitMQProducer
	Log        *zap.Logger
}
