package rabbitmq

import (
	"encoding/json"
	"fmt"
	"os"
)

// ---------------------------------------------------------------------

type Exchange struct {
	Name    string `json:"name"`
	Type    string `json:"type"`
	Durable bool   `json:"durable"`
}

type Queue struct {
	Name    string `json:"name"`
	Durable bool   `json:"durable"`
}

type RoutingKey struct {
	Name     string `json:"name"`
	Exchange string `json:"exchange"`
	Queue    string `json:"queue"`
}

// Configuration for RabbitMQ connection
type RabbitMQConfig struct {
	URL                string       `json:"url"`
	ReconnectDelaySecs int          `json:"reconnect_delay_seconds"`
	Exchanges          []Exchange   `json:"exchanges"`
	Queues             []Queue      `json:"queues"`
	RoutingKeys        []RoutingKey `json:"routing_keys"`
}

// ---------------------------------------------------------------------

func LoadRabbitMQConfig(path string) (RabbitMQConfig, error) {

	var cfg RabbitMQConfig

	f, err := os.Open(path)
	if err != nil {
		return cfg, fmt.Errorf("failed to open config file: %w", err)
	}

	defer f.Close()

	err = json.NewDecoder(f).Decode(&cfg)
	if err != nil {
		return cfg, fmt.Errorf("failed to decode JSON: %w", err)
	}

	urlStr := fmt.Sprintf(
		"amqp://%s:%s@%s:%s/",
		os.Getenv("RABBITMQ_USER"),
		os.Getenv("RABBITMQ_PASSWORD"),
		os.Getenv("RABBITMQ_HOST"),
		os.Getenv("RABBITMQ_PORT"),
	)

	cfg.URL = urlStr

	return cfg, nil
}
