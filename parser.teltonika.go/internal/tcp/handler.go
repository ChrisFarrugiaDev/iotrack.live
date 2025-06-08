package tcp

import (
	"encoding/binary"
	"net"

	"go.uber.org/zap"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/model"
	"iotrack.live/internal/teltonika"
	"iotrack.live/internal/util"
)

// ---------------------------------------------------------------------

// handleTcpData processes incoming TCP data packets from a Teltonika device.
// It distinguishes between IMEI handshake (first packet) and data packets.
func handleTcpData(packet []byte, conn net.Conn, deviceMeta *model.Meta) {

	if len(packet) == 17 {
		// IMEI handshake packet (first message from device: 2 header bytes + 15 bytes IMEI)

		imei, err := teltonika.ImeiParser(packet)
		if err != nil {
			// Send 0x00 (NAK) to device on parsing error (negative acknowledgment)
			conn.Write([]byte{0x00})
			return
		}

		deviceMeta.IMEI = imei

		// Send 0x01 (ACK) to device to acknowledge IMEI (positive acknowledgment)
		conn.Write([]byte{0x01})

	} else {
		// AVL data packet (Codec 8/8E/etc)
		codecID := int(packet[8])
		logger.Debug("", zap.Int("CodecID", codecID))

		teltonikaAvlPacket, err := teltonika.ParseCodec8(packet)

		if err != nil {
			// Send 0x00 (NAK) to device on parsing error
			conn.Write([]byte{0x00})
			return
		}

		// Prepare 4-byte ACK: number of records received, as required by Teltonika protocol
		ack := make([]byte, 4)
		binary.BigEndian.PutUint32(ack, uint32(teltonikaAvlPacket.Quantity1))
		// Send ACK to device (must be exactly 4 bytes)
		conn.Write(ack)

		// Print packet content in human-readable form (for debugging/logging)
		util.PrettyPrint(teltonikaAvlPacket)
	}

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
