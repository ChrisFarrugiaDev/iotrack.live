package appcore

import (
	"sync"

	"github.com/GoWebProd/uuid7"
	"github.com/jackc/pgx/v5/pgxpool"
	"iotrack.live/internal/cache"
	"iotrack.live/internal/models"
	"iotrack.live/internal/rabbitmq"
)

type App struct {
	Cache       *cache.RedisCache
	MQProducer  *rabbitmq.RabbitMQProducer
	DB          *pgxpool.Pool
	Models      models.Models
	Devices     map[string]*models.Device
	DevicesLock sync.RWMutex
	UUID        *uuid7.Generator

	LastTelemetryMap map[string]map[string]interface{}
	UpdatedDevices   map[string]struct{}
	TelemetryLock    sync.Mutex
}
