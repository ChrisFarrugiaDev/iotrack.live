package tcp

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"net"

	"go.uber.org/zap"
	"iotrack.live/internal/cache"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/model"
	"iotrack.live/internal/teltonika"
	"iotrack.live/internal/util"
	// "iotrack.live/internal/util"
)

// ---------------------------------------------------------------------

// handleTcpData processes incoming TCP data packets from a Teltonika device.
// It distinguishes between IMEI handshake (first packet) and data packets.
func handleTcpData(packet []byte, conn net.Conn, deviceMeta *model.Meta) {

	if len(packet) == 17 {

		// --- 1. IMEI Handshake: 000F + 15 ASCII bytes (hex, 34 chars) -----
		imei, err := teltonika.ImeiParser(packet)
		if err != nil {
			// Send 0x00 (NAK) to device on parsing error (negative acknowledgment)
			conn.Write([]byte{0x00})
			return
		}

		deviceMeta.IMEI = imei

		// Send 0x01 (ACK) to device to acknowledge IMEI (positive acknowledgment)
		conn.Write([]byte{0x01})
		return

	}

	// --- 3. Data Packet: Codec 8/8ex (telemetry) or Codec 12 (commands) ---

	// Codec ID is at position 8 (1 byte)
	codecID := int(packet[8])
	logger.Debug("", zap.Int("CodecID", codecID))

	var dataPacket model.TeltonikaPacket
	var err error

	switch codecID {
	case 8:
		dataPacket, err = teltonika.ParseCodec8(packet)

	case 142:
		dataPacket, err = teltonika.ParseCodec8Extended(packet)

	case 12:
		dataPacket, err = teltonika.ParseCodec12(packet)

	default:
		dataPacket, err = nil, fmt.Errorf("CodecID %d not supported", codecID)
	}

	if err != nil {
		// Send 0x00 (NAK) to device on parsing error
		logger.Error("Teltonika Parser Error", zap.Error(err))
		conn.Write([]byte{0x00})
		return
	}

	// -----------------------------------------------------------------

	//  1st check if codec12:inflight-commands is set and if so get value
	inflightExist, _ := cache.AppCache.Exists("codec12:inflight-commands:" + deviceMeta.IMEI)
	logger.Debug(">", zap.Bool("inflightExist", inflightExist))

	pendingExist, _ := cache.AppCache.Exists("codec12:pending-commands:" + deviceMeta.IMEI)

	cmd := []byte{}

	if pendingExist {
		rawJson, _ := cache.AppCache.LPop("codec12:pending-commands:" + deviceMeta.IMEI)

		var pendingCommand model.Codec12Command

		_ = json.Unmarshal([]byte(rawJson), &pendingCommand)

		_ = pendingCommand.SetToInflight()

		cmd, _ = pendingCommand.ToPacket()
	}

	// if not set check if codec12:pending-commands: is set and if is get first value

	// if not set proced with the ack

	// itemRaw, err := cache.AppCache.LPop("codec12:pending-commands:" + deviceMeta.IMEI)

	// if err != nil {
	// 	logger.Error("Unable retrive codec12 pending", zap.String("imei", deviceMeta.IMEI), zap.Error(err))
	// }

	// if itemRaw != nil {
	// 	fmt.Println(itemRaw)
	// }

	// -----------------------------------------------------------------
	// TODO: 1. Determine message type (AVL or Command) from dataPacket.
	// TODO: 2. If pending Codec 12 commands, send them to device before processing AVL data.
	// TODO: 3. Forward parsed data to TS DB via RabbitMQ/Kafka; publish last record via Redis for real-time updates.
	// TODO: 4. Always send correct ACK/NACK back to the device per protocol.
	// -----------------------------------------------------------------

	// Prepare 4-byte ACK: number of records received, as required by Teltonika protocol
	ack := make([]byte, 4)
	binary.BigEndian.PutUint32(ack, uint32(dataPacket.GetQuantity1()))
	// Send ACK to device (must be exactly 4 bytes)

	if len(cmd) > 0 {
		ack = cmd
	}
	conn.Write(ack)

	// Print packet content in human-readable form (for debugging/logging)

	if codecID == 12 {
		util.PrettyPrint(dataPacket)
	}
	fmt.Println(codecID)

}

// ---------------------------------------------------------------------

// handleTcpTimeout logs when a TCP connection times out.
func handleTcpTimeout(deviceMeta *model.Meta) {
	if deviceMeta.IMEI != "" {
		logger.Debug("TCP connection timeout", zap.String("imei", deviceMeta.IMEI))
	} else {
		logger.Debug("TCP connection timeout")
	}
}

// handleTcpClose logs when a TCP connection is closed.
func handleTcpClose(deviceMeta *model.Meta) {
	if deviceMeta.IMEI != "" {
		logger.Debug("TCP connection closed", zap.String("imei", deviceMeta.IMEI))
	} else {
		logger.Debug("TCP connection closed")
	}
}

// handleTcpEnd logs when the remote end closes the TCP connection.
func handleTcpEnd(deviceMeta *model.Meta) {
	if deviceMeta.IMEI != "" {
		logger.Debug("TCP connection ended (remote closed)", zap.String("imei", deviceMeta.IMEI))
	} else {
		logger.Debug("TCP connection ended (remote closed)")
	}
}

// handleTcpError logs any errors that occur during TCP communication.
func handleTcpError(deviceMeta *model.Meta, err error) {
	if deviceMeta.IMEI != "" {
		logger.Error("TCP error", zap.String("imei", deviceMeta.IMEI), zap.Error(err))
	} else {
		logger.Error("TCP error", zap.Error(err))
	}
}
