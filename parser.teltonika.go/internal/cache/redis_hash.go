package cache

import (
	"encoding/json"
	"fmt"
)

// HSet adds a key-value pair to a Redis hash map. The value is serialized to JSON before being stored.
func (rc *RedisCache) HSet(mapKey string, fieldKey string, value any) error {
	conn := rc.Conn.Get()
	defer conn.Close()

	jsonData, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %v", err)
	}

	prefixedMapKey := rc.Prefix + mapKey
	_, err = conn.Do("HSET", prefixedMapKey, fieldKey, jsonData)
	if err != nil {
		return fmt.Errorf("failed to HSET in Redis: %w", err)
	}

	return nil
}
