package tcp

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"net"

	"go.uber.org/zap"
	"iotrack.live/internal/apptypes"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/teltonika"
	// "iotrack.live/internal/util"
)

// ---------------------------------------------------------------------

// handleTcpData processes incoming TCP data packets from a Teltonika device.
// It distinguishes between IMEI handshake (first packet) and data packets.
func (s *TCPServer) handleTcpData(packet []byte, conn net.Conn, deviceMeta *apptypes.Meta) {

	cmd := []byte{}
	ack := make([]byte, 4)

	// Place this at the top of your function:
	fail := func(msg string, err error) {
		logger.Error(msg, zap.String("imei", deviceMeta.IMEI), zap.Error(err))
		conn.Write(ack)
	}

	// --- 1. IMEI Handshake: 000F + 15 ASCII bytes (hex, 34 chars) -----
	if len(packet) == 17 {
		imei, err := teltonika.ImeiParser(packet)
		if err != nil {
			// Negative ACK on error
			conn.Write([]byte{0x00})
			return
		}

		deviceMeta.IMEI = imei
		// Positive ACK
		conn.Write([]byte{0x01})
		return
	}

	// --- 2. Data Packet: Codec 8/8ex (telemetry) or Codec 12 (commands) ---

	// Get Codec ID (always at byte 8)
	codecID := int(packet[8])
	logger.Debug("CodecID detected", zap.Int("CodecID", codecID))

	var dataPacket apptypes.TeltonikaPacket
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
		logger.Error("Teltonika Parser Error", zap.Error(err))
		conn.Write([]byte{0x00})
		return
	}

	// -------------------- Command Send/Retry Logic --------------------

	// Check if a Codec 12 command is currently in-flight for this device
	inflightKey := "codec12:inflight-commands:" + deviceMeta.IMEI
	inflightExist, err := s.App.Cache.Exists(inflightKey)

	if err != nil {
		fail("Redis error while checking inflight command existence", err)
		return
	}

	if inflightExist {
		rawJson, err := s.App.Cache.Get(inflightKey)

		if err != nil {
			fail("Redis error while getting inflight command", err)
			return
		}

		var inflightCommand apptypes.Codec12Command
		err = json.Unmarshal([]byte(rawJson), &inflightCommand)

		if err != nil {
			fail("JSON unmarshal error for inflight command (1)", err)
			return
		}

		switch dataPacket.GetCodecType() {
		case "GPRS messages":
			// Codec 12 response: command completed successfully
			s.App.Cache.Delete(inflightKey)
			codec12Message := dataPacket.(*apptypes.Codec12Message)
			inflightCommand.SetToSync("completed", codec12Message.GetResponse())
			// (Send to DB or sync cache later)

		case "AVL_Data":
			// Still no Codec 12 response—try resend or fail after N tries
			if inflightCommand.Retries < 10 {
				inflightCommand.SetToInflight() // (should increment retry count)
				cmd, err = inflightCommand.ToPacket()

				if err != nil {
					fail("JSON unmarshal error for inflight command (2)", err)
					return
				}

			} else {
				s.App.Cache.Delete(inflightKey)
				inflightCommand.SetToSync("failed", "no_response")
			}
		}
	}

	// If no inflight command, check for pending commands for this device
	pendingKey := "codec12:pending-commands:" + deviceMeta.IMEI
	pendingExist := false
	inflightExist, err = s.App.Cache.Exists(inflightKey)

	if err != nil {
		fail("Redis error while checking inflight command existence (pending check)", err)
		return
	}

	if !inflightExist {
		pendingExist, err = s.App.Cache.Exists(pendingKey)
		if err != nil {
			fail("Redis error while checking pending command existence", err)
			return
		}
	}

	if pendingExist {

		rawJson, err := s.App.Cache.LPop(pendingKey)
		if err != nil {
			fail("Redis error while popping pending command", err)
			return
		}

		var pendingCommand apptypes.Codec12Command

		err = json.Unmarshal([]byte(rawJson), &pendingCommand)

		if err != nil {
			fail("JSON unmarshal error for pending command", err)
			return
		}
		err = pendingCommand.SetToInflight()

		if err != nil {
			fail("Failed to set pending command to inflight", err)
			return
		}

		cmd, err = pendingCommand.ToPacket()

		if err != nil {
			fail("Failed to convert pending command to packet", err)
			return
		}
	}

	// ------------- Send Command (or Telemetry ACK) to Device -------------

	// Teltonika expects a 4-byte ACK (number of records)
	binary.BigEndian.PutUint32(ack, uint32(dataPacket.GetQuantity1()))

	if len(cmd) > 0 {
		// Send command to device (Codec 12 packet)
		conn.Write(cmd)
	} else {
		// ACK to device (for telemetry/etc)
		conn.Write(ack)
	}

	// ------------------- TODO: Data Forwarding --------------------
	// If telemetry, forward to RabbitMQ/Redis for DB and UI consumption

	if dataPacket.GetCodecType() == "AVL_Data" {

		codec8Record := dataPacket.(*apptypes.Codec8AvlRecord)
		for _, avl := range codec8Record.Content.AVL_Datas {
			telemetry := apptypes.Telemetry{
				IMEI:       deviceMeta.IMEI,
				AssetID:    deviceMeta.AssetID,
				Timestamp:  avl.Timestamp,
				Priority:   avl.Priority,
				Longitude:  avl.GPSelement.Longitude,
				Latitude:   avl.GPSelement.Latitude,
				Altitude:   avl.GPSelement.Altitude,
				Angle:      avl.GPSelement.Angle,
				Satellites: avl.GPSelement.Satellites,
				Speed:      avl.GPSelement.Speed,
				EventID:    avl.IOelement.EventID,
				Elements:   avl.IOelement.Elements,
			}
			msg, _ := json.Marshal(telemetry)
			s.App.MQProducer.SendDirectMessage("teltonika_telemetry", "teltonika", string(msg))

			// TODO:  remove only for testing

			if deviceMeta.IMEI == "867747078708748" {
				s.App.MQProducer.SendDirectMessage("teltonika_tat240", "teltonika", string(msg))
			}
		}
	}
	// -- end ------------------------------------------------------
}

// ---------------------------------------------------------------------

// handleTcpTimeout logs when a TCP connection times out.
func (s *TCPServer) handleTcpTimeout(deviceMeta *apptypes.Meta) {
	if deviceMeta.IMEI != "" {
		logger.Debug("TCP connection timeout", zap.String("imei", deviceMeta.IMEI))
	} else {
		logger.Debug("TCP connection timeout")
	}
}

// handleTcpClose logs when a TCP connection is closed.
func (s *TCPServer) handleTcpClose(deviceMeta *apptypes.Meta) {
	if deviceMeta.IMEI != "" {
		logger.Debug("TCP connection closed", zap.String("imei", deviceMeta.IMEI))
	} else {
		logger.Debug("TCP connection closed")
	}
}

// handleTcpEnd logs when the remote end closes the TCP connection.
func (s *TCPServer) handleTcpEnd(deviceMeta *apptypes.Meta) {
	if deviceMeta.IMEI != "" {
		logger.Debug("TCP connection ended (remote closed)", zap.String("imei", deviceMeta.IMEI))
	} else {
		logger.Debug("TCP connection ended (remote closed)")
	}
}

// handleTcpError logs any errors that occur during TCP communication.
func (s *TCPServer) handleTcpError(deviceMeta *apptypes.Meta, err error) {
	if deviceMeta.IMEI != "" {
		logger.Error("TCP error", zap.String("imei", deviceMeta.IMEI), zap.Error(err))
	} else {
		logger.Error("TCP error", zap.Error(err))
	}
}
