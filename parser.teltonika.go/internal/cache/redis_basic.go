package cache

import (
	"encoding/json"
	"fmt"

	"github.com/gomodule/redigo/redis"
)

// Exists checks if a key exists in Redis.
func (rc *RedisCache) Exists(key string) (bool, error) {
	conn := rc.Conn.Get()
	defer conn.Close()

	// Check if key exists
	exists, err := redis.Bool(conn.Do("EXISTS", rc.Prefix+key))
	if err != nil {
		return false, fmt.Errorf("failed to check key existence in Redis: %w", err)
	}

	return exists, nil
}

// Get retrieves a key's value from Redis or nil if not found.
func (rc *RedisCache) Get(key string) (string, error) {
	conn := rc.Conn.Get()
	defer conn.Close()

	// Get the value as a string
	value, err := redis.String(conn.Do("GET", rc.Prefix+key))
	if err != nil {
		if err == redis.ErrNil {
			return "", nil // Key does not exist
		}
		return "", fmt.Errorf("failed to get key from Redis: %w", err)
	}
	return value, nil
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
