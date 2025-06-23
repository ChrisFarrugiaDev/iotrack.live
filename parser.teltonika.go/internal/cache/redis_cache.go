package cache

import (
	"encoding/json"
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

// Set stores a key-value pair in Redis with an optional TTL.
func (rc *RedisCache) Set(key string, value any, ttlSeconds int) error {
	conn := rc.Conn.Get()
	defer conn.Close()

	// Marshal the value to JSON for storage
	jsonData, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %v", err)
	}

	// Set the key with the prefixed key
	if ttlSeconds > 0 {
		// Set with expiration if TTL is specified
		_, err = conn.Do("SETEX", rc.Prefix+key, ttlSeconds, jsonData)
	} else {
		// Set without expiration
		_, err = conn.Do("SET", rc.Prefix+key, jsonData)
	}

	if err != nil {
		return fmt.Errorf("failed to set key in Redis: %w", err)
	}

	return nil
}
