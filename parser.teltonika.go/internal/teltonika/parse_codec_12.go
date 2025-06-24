package teltonika

import (
	"encoding/hex"
	"fmt"

	"iotrack.live/internal/model"
	"iotrack.live/internal/util"
)

func ParseCodec12(data []byte) (*model.Codec12Message, error) {
	offset := 0

	// Check minimum length for header, type, response size, CRC
	if err := assertCanRead(data, offset, 4+4+1+1+1+4+1+4, "header"); err != nil {
		return nil, err
	}

	packet := model.Codec12Message{}
	packet.Packet = hex.EncodeToString(data)

	packet.Preamble = util.BytesToUint32(data[offset:])
	offset += 4
	packet.DataLength = util.BytesToUint32(data[offset:])
	offset += 4
	packet.CodecID = data[offset]
	offset += 1
	packet.Quantity1 = data[offset]
	offset += 1

	typ := data[offset]
	offset += 1
	if typ != 0x06 {
		return nil, fmt.Errorf("not a response packet (type != 6)")
	}

	respSize := util.BytesToUint32(data[offset:])
	offset += 4

	if err := assertCanRead(data, offset, int(respSize), "response"); err != nil {
		return nil, err
	}

	respRaw := data[offset : offset+int(respSize)]
	offset += int(respSize)

	quantity2 := data[offset]
	offset += 1

	crc := util.BytesToUint32(data[offset:])
	offset += 4

	// Try to decode response as ASCII; if not printable, fallback to hex
	var respStr string
	if util.IsPrintableASCII(respRaw) {
		respStr = string(respRaw)
	} else {
		respStr = "New value " + util.BytesToHexPairsString(respRaw)
	}

	packet.CRC = crc
	packet.Quantity2 = quantity2
	packet.CodecType = "GPRS messages"
	packet.Content = model.GPRS{
		IsResponse:  true,
		Type:        typ,
		ResponseStr: respStr,
	}

	return &packet, nil
}
