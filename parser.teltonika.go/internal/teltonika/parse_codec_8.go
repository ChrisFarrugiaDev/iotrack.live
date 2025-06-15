package teltonika

import (
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"iotrack.live/internal/model"
	"iotrack.live/internal/util"
)

func ParseCodec8(data []byte) (*model.Codec8AvlRecord, error) {

	offset := 0

	// 1. Header
	if err := assertCanRead(data, offset, 4+4+1+1, "header"); err != nil {
		return nil, err
	}

	packet := model.Codec8AvlRecord{}

	// Save hex string for full packet
	packet.Packet = hex.EncodeToString(data)

	packet.Preamble = util.BytesToUint32(data[offset:])
	offset += 4
	packet.DataLength = util.BytesToUint32(data[offset:])
	offset += 4
	packet.CodecID = data[offset]
	offset += 1
	packet.CodecType = "AVL_Data"

	packet.Quantity1 = data[offset]
	offset += 1

	avlDatas := make([]model.AvlData, 0, packet.Quantity1)

	// 2. Parse each AVL record (skeleton, you’ll fill details below)

	for i := 0; i < int(packet.Quantity1); i++ {
		// Before each major section, check offset:
		if err := assertCanRead(data, offset, 8+1+15+2+1+1+1+1, "minimum record size"); err != nil {
			return nil, err
		}

		avl := model.AvlData{}
		// Timestamp (8 bytes, ms since epoch)
		ts := util.BytesToUint64(data[offset:])
		avl.Timestamp = time.UnixMilli(int64(ts)).UTC().Format(time.RFC3339Nano)
		offset += 8

		// --- Priority (1 byte)
		avl.Priority = data[offset]
		offset += 1

		// --- GPSelement (15 bytes: 4+4+2+2+1+2)
		gps := model.GPSelement{}
		longitudeRaw := int32(util.BytesToUint32(data[offset : offset+4]))
		gps.Longitude = float64(longitudeRaw) / 10000000
		offset += 4
		latitudeRaw := int32(util.BytesToUint32(data[offset : offset+4]))
		gps.Latitude = float64(latitudeRaw) / 10000000
		offset += 4
		gps.Altitude = int16(util.BytesToUint16(data[offset : offset+2]))
		offset += 2
		gps.Angle = util.BytesToUint16(data[offset : offset+2])
		offset += 2
		gps.Satellites = data[offset]
		offset += 1
		gps.Speed = util.BytesToUint16(data[offset : offset+2])
		offset += 2
		avl.GPSelement = gps

		// --- IOelement (start: Event ID + N Total)
		ioElem := model.IOelement{}
		ioElem.EventID = int(data[offset])
		offset += 1
		ioElem.ElementCount = int(data[offset])
		offset += 1

		ioElem.Elements = make(map[string]interface{})

		// --- N1: 1-byte IO elements
		n1 := int(data[offset])
		offset += 1
		for j := 0; j < n1; j++ {
			if err := assertCanRead(data, offset, 2, "N1 IO element"); err != nil {
				return nil, err
			}
			id := int(data[offset])
			val := int(data[offset+1])
			ioElem.Elements[fmt.Sprintf("%d", id)] = val
			offset += 2
		}

		// --- N2: 2-byte IO elements
		n2 := int(data[offset])
		offset += 1
		for j := 0; j < n2; j++ {
			if err := assertCanRead(data, offset, 3, "N2 IO element"); err != nil {
				return nil, err
			}
			id := int(data[offset])
			val := int(util.BytesToUint16(data[offset+1 : offset+3]))
			ioElem.Elements[fmt.Sprintf("%d", id)] = val
			offset += 3
		}

		// --- N4: 4-byte IO elements
		n4 := int(data[offset])
		offset += 1
		for j := 0; j < n4; j++ {
			if err := assertCanRead(data, offset, 5, "N4 IO element"); err != nil {
				return nil, err
			}
			id := int(data[offset])
			val := int32(util.BytesToUint32(data[offset+1 : offset+5]))
			ioElem.Elements[fmt.Sprintf("%d", id)] = val
			offset += 5
		}

		// --- N8: 8-byte IO elements
		n8 := int(data[offset])
		offset += 1
		for j := 0; j < n8; j++ {
			if err := assertCanRead(data, offset, 9, "N8 IO element"); err != nil {
				return nil, err
			}
			id := int(data[offset])
			val := util.BytesToUint64(data[offset+1 : offset+9])
			// To be compatible with JS: if value is small enough, use int, else use string
			if val <= uint64(^uint32(0)) { // You can choose your safe threshold here
				ioElem.Elements[fmt.Sprintf("%d", id)] = val
			} else {
				ioElem.Elements[fmt.Sprintf("%d", id)] = fmt.Sprintf("%d", val)
			}
			offset += 9
		}

		avl.IOelement = ioElem

		// --- Add the parsed AVL record to the list
		avlDatas = append(avlDatas, avl)

	}

	// 3. Trailing fields (Quantity2 and CRC)
	if err := assertCanRead(data, offset, 1+4, "Quantity2 and CRC"); err != nil {
		return nil, err
	}
	packet.Quantity2 = data[offset]
	offset += 1
	if packet.Quantity2 != packet.Quantity1 {
		return nil, errors.New("Quantity2 does not match Quantity1")
	}
	packet.CRC = util.BytesToUint32(data[offset:])
	offset += 4

	packet.Content = model.Content{AVL_Datas: avlDatas}

	// Final check
	if offset != len(data) {
		return nil, fmt.Errorf("buffer not fully consumed (offset %d vs %d)", offset, len(data))
	}

	return &packet, nil
}
