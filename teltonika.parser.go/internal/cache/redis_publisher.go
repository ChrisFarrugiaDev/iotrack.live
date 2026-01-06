package cache

import (
	"github.com/gomodule/redigo/redis"
)

// PubMsg represents a single publish message with channel and payload (already []byte/JSON).
type PubMsg struct {
	Channel string
	Payload []byte
}

// StartPublisher launches a background goroutine that listens for PubMsg values
// on a channel and publishes them to Redis.
//
//	rc  = your RedisCache instance
//	buf = buffer size for the internal channel (for burst tolerance)
//
// Returns:
//   - A send-only channel (chan<- PubMsg) for publishing messages.
//   - A stop function to gracefully shutdown the goroutine.
func StartPublisher(rc *RedisCache, buf int) (chan<- PubMsg, func()) {
	ch := make(chan PubMsg, buf) // Buffered channel for sending PubMsg (publishing requests)
	done := make(chan struct{})  // Signals when the goroutine has exited

	go func() {
		defer close(done)
		var conn redis.Conn

		// Helper to get a fresh Redis connection (closes old one first)
		getConn := func() redis.Conn {
			if conn != nil {
				conn.Close()
			}
			return rc.Conn.Get()
		}

		conn = getConn() // Initialize first connection

		// Loop: read messages from the channel and publish
		for m := range ch {
			_, err := conn.Do("PUBLISH", m.Channel, m.Payload)

			if err != nil {
				// On error (connection problem), reconnect and try once more
				conn = getConn()
				_, _ = conn.Do("PUBLISH", m.Channel, m.Payload)
			}
		}

		// When ch is closed, clean up
		if conn != nil {
			conn.Close()
		}
	}()

	// stop function: closes the channel and waits for goroutine to exit
	stop := func() {
		close(ch)
		<-done
	}

	return ch, stop
}
