package teltonika

import (
	"errors"

	"go.uber.org/zap"
	"iotrack.live/internal/logger"
)

func ImeiParser(packet []byte) (string, error) {
	if len(packet) < 2 {
		logger.Error("Packet too short for IMEI")
		return "", errors.New("packet too short for IMEI")
	}
	length := int(packet[1])
	if len(packet) < 2+length {
		logger.Error("Packet too short for IMEI length", zap.Int("length", length))
		return "", errors.New("packet too short for IMEI length")
	}
	imei := string(packet[2 : 2+length])
	logger.Debug("Parsed IMEI", zap.String("imei", imei))

	return imei, nil
}
