package rabbitmq

import (
	"fmt"
	"os"
	"time"
)

// Configuration for RabbitMQ connection
type RabbitConfig struct {
	URL            string
	ReconnectDelay time.Duration
	Queues         map[string]Queue
	Exchanges      map[string]Exchange
	RoutingKey     map[string]Bind
}

// ---------------------------------------------------------------------

type Exchange struct {
	Name    string
	Type    string // "direct" or "fanout"
	Durable bool
}

type Queue struct {
	Name    string
	Durable bool
}

type Bind struct {
	Exchange string
	Queue    string
}

// ---------------------------------------------------------------------

var Exchanges = map[string]Exchange{
	"teltonika": {
		Name:    "teltonika",
		Type:    "direct",
		Durable: true,
	},
}

var Queues = map[string]Queue{
	"telemetry": {
		Name:    "telemetry",
		Durable: true,
	},
}

var RoutingKeys = map[string]Bind{
	"teltonika_telemetry": {
		Exchange: "teltonika",
		Queue:    "telemetry",
	},
}

// ---------------------------------------------------------------------

func SetupRabbitMQConfig() RabbitConfig {
	// Setup your RabbitMQ configuration here
	var rabbitmqPort string

	switch os.Getenv("GO_ENV") {
	case "production":
		rabbitmqPort = os.Getenv("RABBITMQ_PORT")
	default:
		rabbitmqPort = os.Getenv("RABBITMQ_PORT_EX")
	}
	urlStr := fmt.Sprintf("amqp://%s:%s@%s:%s/", os.Getenv("RABBITMQ_USER"), os.Getenv("RABBITMQ_PASSWORD"), os.Getenv("RABBITMQ_HOST"), rabbitmqPort)
	return RabbitConfig{
		URL:            urlStr,
		ReconnectDelay: 10 * time.Second,

		Queues:     Queues,
		Exchanges:  Exchanges,
		RoutingKey: RoutingKeys,
	}
}
