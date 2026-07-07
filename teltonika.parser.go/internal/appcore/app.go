package appcore

import (
	"sync"
	"time"

	"github.com/GoWebProd/uuid7"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/robfig/cron/v3"

	"iotrack.live/teltonika.parser.go/internal/apptypes"
	"iotrack.live/teltonika.parser.go/internal/cache"
	"iotrack.live/teltonika.parser.go/internal/models"
	"iotrack.live/teltonika.parser.go/internal/rabbitmq"
)

type App struct { // (ref:001)
	Cache      *cache.RedisCache
	Cron       *cron.Cron
	MQProducer *rabbitmq.RabbitMQProducer
	DB         *pgxpool.Pool
	Models     models.Models

	Devices     map[string]*models.Device
	DevicesLock sync.RWMutex

	Organisations     map[string]*models.Organisation
	OrganisationsLock sync.RWMutex
	UUID              *uuid7.Generator

	LastTsMap           map[int64]time.Time
	LastTsLock          sync.RWMutex
	LastTelemetryMap map[int64]apptypes.FlatAvlRecord

	// Set of device IDs that received new telemetry since the last flush.
	// Swapped out under LatestTelemetryLock on each flush (see FlushLastTelemetry).
	UpdatedDevices map[int64]struct{}

	LatestTelemetryLock sync.Mutex

	// Redis publisher
	PubCh chan<- cache.PubMsg // send-only channel for publishing
}
