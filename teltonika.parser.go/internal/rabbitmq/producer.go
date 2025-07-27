package rabbitmq

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/GoWebProd/uuid7"
	amqp "github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
	"iotrack.live/internal/logger"
)

// RabbitMQProducer manages the connection and publishing to RabbitMQ
type RabbitMQProducer struct {
	config     RabbitMQConfig
	connection *amqp.Connection
	channel    *amqp.Channel

	exchangesMap   map[string]Exchange
	queuesMap      map[string]Queue
	routingKeysMap map[string]RoutingKey

	UUID *uuid7.Generator
}

var AppRabbitMQProducer *RabbitMQProducer

// NewRabbitMQProducer creates a new producer instance
func NewRabbitMQProducer(config RabbitMQConfig) *RabbitMQProducer {
	AppRabbitMQProducer = &RabbitMQProducer{
		config:         config,
		exchangesMap:   make(map[string]Exchange),
		queuesMap:      make(map[string]Queue),
		routingKeysMap: make(map[string]RoutingKey),
		UUID:           uuid7.New(),
	}

	for _, ex := range config.Exchanges {
		AppRabbitMQProducer.exchangesMap[ex.Name] = ex
	}

	for _, q := range config.Queues {
		AppRabbitMQProducer.queuesMap[q.Name] = q
	}

	for _, rk := range config.RoutingKeys {
		AppRabbitMQProducer.routingKeysMap[rk.Name] = rk
	}

	return AppRabbitMQProducer
}

// ---------------------------------------------------------------------

// Run starts the connection and the publishing process
func (p *RabbitMQProducer) Run() {
	for {
		if p.connect() {

			port, _ := strconv.Atoi(os.Getenv("RABBITMQ_PORT"))
			logger.Info("Successfully connected to RabbitMQ", zap.Int("Port", port))
			p.monitorConnection() // Start monitoring the connection for closures
			break                 // Exit the loop after a successful connection
		}

		// Wait before retrying the connection
		logger.Info(fmt.Sprintf("Retrying connection to RabbitMQ in %d...", p.config.ReconnectDelaySecs))
		time.Sleep(time.Duration(p.config.ReconnectDelaySecs) * time.Second)
	}
}

// connect handles the connection and channel setup, including declaring multiple queues
func (p *RabbitMQProducer) connect() bool {
	var err error
	p.connection, err = amqp.Dial(p.config.URL)
	if err != nil {
		logger.Error("Failed to connect to RabbitMQ", zap.Error(err))
		return false
	}

	p.channel, err = p.connection.Channel()
	if err != nil {
		if p.connection != nil {
			p.connection.Close()
		}
		logger.Error("Failed to open a channel", zap.Error(err))
		return false
	}

	if err := p.setupExchangesAndQueues(); err != nil {
		return false
	}

	return true
}

func (p *RabbitMQProducer) setupExchangesAndQueues() error {
	// Declare Exchanges
	for _, exchange := range p.config.Exchanges {
		err := p.channel.ExchangeDeclare(exchange.Name, exchange.Type, exchange.Durable, false, false, false, nil)
		if err != nil {
			return err
		}
	}

	// Declare Queues
	for _, queue := range p.config.Queues {
		_, err := p.channel.QueueDeclare(queue.Name, queue.Durable, false, false, false, nil)
		if err != nil {
			return err
		}
	}

	// Binding Queues to Exchanges
	for _, routingKey := range p.config.RoutingKeys {
		err := p.channel.QueueBind(routingKey.Queue, routingKey.Name, routingKey.Exchange, false, nil)
		if err != nil {
			return err
		}
	}

	return nil
}

func (p *RabbitMQProducer) monitorConnection() {
	go func() {
		for {
			reason, ok := <-p.connection.NotifyClose(make(chan *amqp.Error))
			if !ok {
				logger.Info("Channel and connection closed")
				break
			}
			logger.Error("Trying to reconnect...", zap.Error(fmt.Errorf("connection closed: %s", reason)))
			for {
				if p.connect() {
					logger.Info("Reconnection successful")
					return
				}
				time.Sleep(time.Duration(p.config.ReconnectDelaySecs))
			}
		}
	}()
}

// SendFanoutMessage sends a message to a fanout exchange (routing key is ignored).
// Use this for pub/sub or broadcasts.
func (p *RabbitMQProducer) SendFanoutMessage(exchangeName, message string) {
	exchange, ok := p.exchangesMap[exchangeName]
	if !ok {
		logger.Error(
			fmt.Sprintf("Exchange '%s' does not exist", exchangeName),
			zap.Error(errors.New("exchange not found")),
		)
		return
	}

	err := p.channel.Publish(
		exchange.Name, // exchange name to publish to
		"",            // routing key (empty if not needed)
		false,         // mandatory
		false,         // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(message),
			MessageId:   p.UUID.Next().String(),
		},
	)

	if err != nil {
		logger.Error(
			fmt.Sprintf("Failed to publish message to exchange '%s'", exchangeName),
			zap.Error(err),
		)
	}
}

// SendDirectMessage sends a message to a direct or topic exchange with a specific routing key.
func (p *RabbitMQProducer) SendDirectMessage(routingKeyName, exchangeName, message string) {
	routingKey, ok := p.routingKeysMap[routingKeyName]
	if !ok {
		logger.Error(
			fmt.Sprintf("Routing key '%s' does not exist", routingKeyName),
			zap.Error(errors.New("routingKey not found")),
		)
		return
	}
	if routingKey.Exchange != exchangeName {
		logger.Error(
			fmt.Sprintf("Routing key '%s' is configured for exchange '%s', but received exchange '%s'",
				routingKeyName, routingKey.Exchange, exchangeName),
			zap.Error(errors.New("exchange mismatch")),
		)
		return
	}

	err := p.channel.Publish(
		exchangeName,
		routingKeyName,
		false, // mandatory
		false, // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(message),
			MessageId:   p.UUID.Next().String(),
		},
	)

	if err != nil {
		logger.Error(
			fmt.Sprintf("Failed to publish message using routing key '%s' on exchange '%s'", routingKeyName, exchangeName),
			zap.Error(err),
		)
	}
}

// Close cleanly closes the channel and connection
func (p *RabbitMQProducer) Close() {
	if p.channel != nil {
		if err := p.channel.Close(); err != nil {
			logger.Error("Failed to close RabbitMQ channel", zap.Error(err))
		} else {
			logger.Info("RabbitMQ channel closed gracefully.")
		}
	}
	if p.connection != nil {
		if err := p.connection.Close(); err != nil {
			logger.Error("Failed to close RabbitMQ connection", zap.Error(err))
		} else {
			logger.Info("RabbitMQ connection closed gracefully.")
		}
	}
}
