package rabbitmq

import (
	"os"
	"testing"

	"iotrack.live/teltonika.parser.go/internal/logger"
)

func TestMain(m *testing.M) {
	os.Setenv("LOG_MODE", "off")
	logger.InitLogger()
	os.Exit(m.Run())
}

func TestSendDirectMessageDoesNotPanicWhenChannelIsNil(t *testing.T) {
	producer := NewRabbitMQProducer(RabbitMQConfig{
		Exchanges: []Exchange{
			{Name: "teltonika", Type: "direct", Durable: true},
		},
		RoutingKeys: []RoutingKey{
			{Name: "teltonika_telemetry", Exchange: "teltonika", Queue: "telemetry"},
		},
	})

	assertDoesNotPanic(t, func() {
		producer.SendDirectMessage("teltonika_telemetry", "teltonika", "{}")
	})
}

func TestSendFanoutMessageDoesNotPanicWhenChannelIsNil(t *testing.T) {
	producer := NewRabbitMQProducer(RabbitMQConfig{
		Exchanges: []Exchange{
			{Name: "teltonika", Type: "fanout", Durable: true},
		},
	})

	assertDoesNotPanic(t, func() {
		producer.SendFanoutMessage("teltonika", "{}")
	})
}

func TestSendMessagesDoNotPanicWhenProducerIsNil(t *testing.T) {
	var producer *RabbitMQProducer

	assertDoesNotPanic(t, func() {
		producer.SendDirectMessage("teltonika_telemetry", "teltonika", "{}")
	})

	assertDoesNotPanic(t, func() {
		producer.SendFanoutMessage("teltonika", "{}")
	})
}

func assertDoesNotPanic(t *testing.T, fn func()) {
	t.Helper()

	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("function panicked: %v", r)
		}
	}()

	fn()
}
