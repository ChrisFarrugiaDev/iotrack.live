package cache

import (
	"encoding/json"
	"fmt"

	"github.com/gomodule/redigo/redis"
	"iotrack.live/internal/models"
)

// HSet adds a key-value pair to a Redis hash map. The value is serialized to JSON before being stored.
func (rc *RedisCache) HSet(mapKey string, fieldKey string, value any, prefix ...string) error {
	conn := rc.Conn.Get()
	defer conn.Close()

	jsonData, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %v", err)
	}

	finalPrefix := rc.Prefix
	if len(prefix) > 0 && prefix[0] != "" {
		finalPrefix = prefix[0]
	}

	prefixedMapKey := finalPrefix + mapKey
	_, err = conn.Do("HSET", prefixedMapKey, fieldKey, jsonData)
	if err != nil {
		return fmt.Errorf("failed to HSET in Redis: %w", err)
	}

	return nil
}

//----------------------------------------------------------------------

// HGetAll retrieves all key-value pairs from a Redis hash map and deserializes them from JSON to `any` types.
func (rc *RedisCache) HGetAll(mapKey string, prefix ...string) (map[string]string, error) {
	conn := rc.Conn.Get()
	defer conn.Close()

	finalPrefix := rc.Prefix
	if len(prefix) > 0 && prefix[0] != "" {
		finalPrefix = prefix[0]
	}

	prefixedMapKey := finalPrefix + mapKey

	items, err := redis.StringMap(conn.Do("HGETALL", prefixedMapKey))
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve items from Redis hash map: %v", err)
	}

	return items, nil
}

// ---------------------------------------------------------------------
func (rc *RedisCache) ReplaceDeviceHashWithLua(
	key string,
	devices map[string]*models.Device,
	prefix ...string, // optional prefix
) error {
	conn := rc.Conn.Get()
	defer conn.Close()

	// Use provided prefix if given, else use rc.Prefix
	finalPrefix := rc.Prefix
	if len(prefix) > 0 && prefix[0] != "" {
		finalPrefix = prefix[0]
	}

	// Build ARGV: field1, value1, field2, value2, …
	var argv []any
	for k, v := range devices {
		jsonVal, err := json.Marshal(v)
		if err != nil {
			return fmt.Errorf("failed to marshal device %s: %w", k, err)
		}
		argv = append(argv, k, jsonVal)
	}

	luaScript := `
        redis.call('DEL', KEYS[1])
        if #ARGV > 0 then
            redis.call('HSET', KEYS[1], unpack(ARGV))
        end
        return 1
    `

	prefixedKey := finalPrefix + key

	// Assemble the full argument slice: script, numkeys, prefixedKey, ARGV…
	evalArgs := append(
		[]any{luaScript, 1, prefixedKey},
		argv..., // expanded once, at the end
	)

	_, err := conn.Do("EVAL", evalArgs...)
	return err
}

func (rc *RedisCache) ReplaceOrganisationHashWithLua(
	key string,
	organisations map[string]*models.Organisation,
	prefix ...string,
) error {
	conn := rc.Conn.Get()
	defer conn.Close()

	// Use the provided prefix if given, else use rc.Prefix
	finalPrefix := rc.Prefix
	if len(prefix) > 0 && prefix[0] != "" {
		finalPrefix = prefix[0]
	}

	// Build ARGV: field1, value1, field2, value2, …
	var argv []any
	for k, v := range organisations {
		jsonVal, err := json.Marshal(v)
		if err != nil {
			return fmt.Errorf("failed to marshal organisation %s: %w", k, err)
		}
		argv = append(argv, k, jsonVal)
	}

	luaScript := `
        redis.call('DEL', KEYS[1])
        if #ARGV > 0 then
            redis.call('HSET', KEYS[1], unpack(ARGV))
        end
        return 1
    `

	prefixedKey := finalPrefix + key

	// Assemble the full argument slice: script, numkeys, prefixedKey, ARGV…
	// We only use **one** slice expansion (at the very end).
	evalArgs := append(
		[]any{luaScript, 1, prefixedKey},
		argv..., // <- expanded once, at the end
	)

	_, err := conn.Do("EVAL", evalArgs...)
	return err
}
