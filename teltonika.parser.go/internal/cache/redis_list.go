package cache

import (
	"fmt"

	"github.com/gomodule/redigo/redis"
)

// Removes and returns the first elements of the list stored at key.
func (rc *RedisCache) LPop(key string) (string, error) {
	conn := rc.Conn.Get()
	defer conn.Close()

	prefixedKey := rc.Prefix + key
	item, err := redis.String(conn.Do("LPOP", prefixedKey))
	if err != nil {
		if err == redis.ErrNil {
			return "", nil // or "", err depending on what you prefer
		}
		return "", fmt.Errorf("failed to retrieve item from Redis list: %w", err)
	}
	return item, nil
}
