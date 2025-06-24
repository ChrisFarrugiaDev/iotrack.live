package model

import (
	"bytes"
	"encoding/binary"
	"encoding/hex"
	"strings"
	"time"

	"iotrack.live/internal/cache"
	"iotrack.live/internal/util"
)

type Codec12Command struct {
	ID          int64      `json:"id"`
	UUID        string     `json:"uuid"`
	IMEI        string     `json:"imei"`
	Command     string     `json:"command"`
	Status      string     `json:"status"`
	CreatedAt   *time.Time `json:"created_at,omitempty"`
	SentAt      *time.Time `json:"sent_at,omitempty"`
	RespondedAt *time.Time `json:"responded_at,omitempty"`
	Response    string     `json:"response"`
	Retries     int        `json:"retries"`
	Comment     string     `json:"comment"`
}

// ToPacket serializes the Codec12Command struct into a Teltonika Codec12 command packet ([]byte),
// ready to be sent directly to a device via a TCP connection.
func (c *Codec12Command) ToPacket() ([]byte, error) {

	// Protocol constants (as per Teltonika Codec12 specification)
	preamble := []byte{0x00, 0x00, 0x00, 0x00} // 4 bytes: message start marker
	codecId := byte(0x0C)                      // 0x0C = Codec12
	commandQuantity1 := byte(0x01)             // Number of commands in this packet (usually 1)
	cmdType := byte(0x05)                      //0x05 for "command", 0x06 for "response"
	commandQuantity2 := byte(0x01)             // Repeats above (per protocol)

	// Command as ASCII bytes (not hex-encoded!)
	commandBytes := []byte(c.Command)
	// Command length as a 4-byte unsigned int, big-endian
	commandSize := uint32(len(commandBytes))

	// Build the Codec12 "payload" (everything after the length field, before CRC)
	var payload bytes.Buffer
	payload.WriteByte(codecId)                            // 1 byte: Codec ID
	payload.WriteByte(commandQuantity1)                   // 1 byte: Number of commands (1)
	payload.WriteByte(cmdType)                            // 1 byte: Command type
	binary.Write(&payload, binary.BigEndian, commandSize) // 4 bytes: Command length (big-endian)
	payload.Write(commandBytes)                           // N bytes: The command itself
	payload.WriteByte(commandQuantity2)                   // 1 byte: End marker/quantity

	// Data field length: size of the payload (4 bytes, big-endian)
	dataFieldLength := uint32(payload.Len())

	// Assemble the full message: preamble + length + payload + CRC
	var message bytes.Buffer
	message.Write(preamble)                                   // 4 bytes: preamble
	binary.Write(&message, binary.BigEndian, dataFieldLength) // 4 bytes: data field length
	message.Write(payload.Bytes())                            // N bytes: payload

	// CRC16-IBM over the payload only (per protocol)
	crc := util.Crc16IBM(payload.Bytes())
	binary.Write(&message, binary.BigEndian, uint32(crc)) // 4 bytes (big-endian, padded)

	// Return the full binary packet
	return message.Bytes(), nil
}

func (c *Codec12Command) BytesToHexString(b []byte) string {
	return strings.ToUpper(hex.EncodeToString(b))
}

func (c *Codec12Command) SetToInflight() error {
	if c.SentAt != nil {
		c.Retries++
	}

	t := time.Now().UTC()
	c.SentAt = &t
	err := cache.AppCache.Set("codec12:inflight-commands:"+c.IMEI, c, -1)
	return err
}
