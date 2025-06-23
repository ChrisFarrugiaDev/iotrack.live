package cache

import (
	"encoding/json"
	"fmt"

	"github.com/gomodule/redigo/redis"
)

// Removes and returns the first elements of the list stored at key.
func (rc *RedisCache) LPop(key string) (any, error) {
	conn := rc.Conn.Get()
	defer conn.Close()

	prefixedKey := rc.Prefix + key

	item, err := redis.String(conn.Do("LPOP", prefixedKey))

	if err != nil {
		if err == redis.ErrNil {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to retrieve item from Redis list: %w", err)
	}

	// Unmarshal the JSON data into an `any` type
	var result any
	err = json.Unmarshal([]byte(item), &result)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal item from Redis list: %w", err)
	}

	return result, nil
}
