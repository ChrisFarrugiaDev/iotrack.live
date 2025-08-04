package cache

import (
	"fmt"

	"github.com/gomodule/redigo/redis"
)

// SAdd adds one or more values to a Redis set. Duplicate values are ignored by Redis.
func (rc *RedisCache) SAdd(setKey string, values ...string) error {

	conn := rc.Conn.Get()
	defer conn.Close()

	prefixedSetKey := rc.Prefix + setKey

	// Convert []string to []any for variadic expansion
	args := make([]any, 1+len(values))
	args[0] = prefixedSetKey

	for i, v := range values {
		args[i+1] = v
	}

	_, err := conn.Do("SADD", args...)
	if err != nil {
		return fmt.Errorf("failed to SADD to Redis set: %w", err)
	}

	return nil
}

// SMembers retrieves all members of a Redis set.
func (rc *RedisCache) SMembers(setKey string) ([]string, error) {

	conn := rc.Conn.Get()
	defer conn.Close()

	prefixedSetKey := rc.Prefix + setKey

	members, err := redis.Strings(conn.Do("SMEMBERS", prefixedSetKey))
	if err != nil {
		return nil, fmt.Errorf("failed to get members from Redis set: %w", err)
	}
	return members, nil
}

// SAddLua atomically adds one or more values to a Redis set using Lua.
// It prevents race conditions by running as a single operation in Redis.
func (rc *RedisCache) SAddLua(setKey string, values ...string) error {
	conn := rc.Conn.Get()
	defer conn.Close()

	prefixedSetKey := rc.Prefix + setKey

	// Lua script: add each value in ARGV to the set at KEYS[1]
	luaScript := `
		for i = 1, #ARGV do
			redis.call('SADD', KEYS[1], ARGV[i])
		end
		return 1
	`

	// Prepare arguments: script, numkeys, key, values...
	args := make([]any, 0, 3+len(values))
	args = append(args, luaScript, 1, prefixedSetKey)
	for _, v := range values {
		args = append(args, v)
	}

	_, err := conn.Do("EVAL", args...)
	if err != nil {
		return fmt.Errorf("failed to SAdd with Lua to Redis set: %w", err)
	}
	return nil
}
