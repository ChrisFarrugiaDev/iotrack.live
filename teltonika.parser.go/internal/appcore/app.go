package appcore

import (
	"sync"

	"github.com/GoWebProd/uuid7"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/robfig/cron/v3"

	"iotrack.live/internal/apptypes"
	"iotrack.live/internal/cache"
	"iotrack.live/internal/models"
	"iotrack.live/internal/rabbitmq"
)

type App struct {
	Cache       *cache.RedisCache
	Cron        *cron.Cron
	MQProducer  *rabbitmq.RabbitMQProducer
	DB          *pgxpool.Pool
	Models      models.Models
	Devices     map[string]*models.Device
	DevicesLock sync.RWMutex
	UUID        *uuid7.Generator

	LastTelemetryMap    map[string]apptypes.FlatAvlRecord
	UpdatedDevicesSetA  map[string]struct{}
	UpdatedDevicesSetB  map[string]struct{}
	ActiveList          string //  A/B double-buffering
	LatestTelemetryLock sync.Mutex
}
