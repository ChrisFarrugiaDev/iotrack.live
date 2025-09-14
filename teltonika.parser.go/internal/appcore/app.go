package appcore

import (
	"sync"
	"time"

	"github.com/GoWebProd/uuid7"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/robfig/cron/v3"

	"iotrack.live/internal/apptypes"
	"iotrack.live/internal/cache"
	"iotrack.live/internal/models"
	"iotrack.live/internal/rabbitmq"
)

type App struct {
	Cache             *cache.RedisCache
	Cron              *cron.Cron
	MQProducer        *rabbitmq.RabbitMQProducer
	DB                *pgxpool.Pool
	Models            models.Models
	Devices           map[string]*models.Device
	DevicesLock       sync.RWMutex
	Organisations     map[string]*models.Organisation
	OrganisationsLock sync.RWMutex
	UUID              *uuid7.Generator

	LastTsMap           map[int64]time.Time
	LastTelemetryMap    map[int64]apptypes.FlatAvlRecord
	UpdatedDevicesSetA  map[int64]struct{}
	UpdatedDevicesSetB  map[int64]struct{}
	ActiveList          string //  A/B double-buffering
	LatestTelemetryLock sync.Mutex

	// Redis publisher
	PubCh chan<- cache.PubMsg // send-only channel for publishing
}
