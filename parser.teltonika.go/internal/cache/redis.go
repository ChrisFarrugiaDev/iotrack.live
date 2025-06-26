package cache

import (
	"fmt"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/gomodule/redigo/redis"
	"iotrack.live/internal/logger"
)

type RedisCache struct {
	Conn   *redis.Pool
	Prefix string
	mu     sync.Mutex
}

var AppCache *RedisCache

func NewCache(c *redis.Pool, p string) *RedisCache {
	AppCache = &RedisCache{
		Conn:   c,
		Prefix: p,
	}
	return AppCache
}

func CreateRedisPool() (*redis.Pool, error) {

	redisPort, err := strconv.Atoi(os.Getenv("REDIS_PORT"))

	if err != nil {
		logger.Warn("REDIS_PORT environment variable not set, using default 6379")
		redisPort = 6379
	}

	redisDB, err := strconv.Atoi(os.Getenv("REDIS_DB"))

	if err != nil {
		logger.Warn("REDIS_DB environment variable not set, using default 0")
		redisDB = 0
	}

	redisHost := os.Getenv("REDIS_HOST")

	if redisHost == "" {
		logger.Warn("REDIS_HOST environment variable not set, using default 127.0.0.1")
		redisHost = "127.0.0.1"
	}

	redisPassword := os.Getenv("REDIS_PASSWORD")

	if redisPassword == "" {
		logger.Warn("REDIS_PASSWORD environment variable not set")
		redisPassword = ""
	}

	pool := &redis.Pool{
		MaxIdle:     50,
		MaxActive:   10000,
		IdleTimeout: 240 * time.Second,

		Dial: func() (redis.Conn, error) {
			redisAddress := fmt.Sprintf("%s:%d", redisHost, redisPort)

			conn, err := redis.Dial(
				"tcp",
				redisAddress,
				redis.DialPassword(redisPassword),
				redis.DialDatabase(redisDB),
			)
			if err != nil {
				return nil, err
			}

			// Test the connection
			if _, err := conn.Do("PING"); err != nil {
				conn.Close()
				return nil, err
			}

			return conn, nil
		},

		TestOnBorrow: func(c redis.Conn, lastUsed time.Time) error {
			_, err := c.Do("PING")
			return err
		},
	}

	// Test the pool connection by getting a connection and PINGing
	conn := pool.Get()
	defer conn.Close()

	_, err = conn.Do("PING")
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %v", err)
	}

	return pool, err
}

func (r *RedisCache) Close() error {
	if r == nil || r.Conn == nil {
		return nil
	}
	return r.Conn.Close()
}
