package model

type Codec12CommandMessage struct {
	Meta       Meta   `json:"meta"`
	Packet     string `json:"Packet"`
	Preamble   uint32 `json:"Preamble"`
	DataLength uint32 `json:"Data_Length"`
	CodecID    byte   `json:"CodecID"`
	Quantity1  byte   `json:"Quantity1"`
	CRC        uint32 `json:"CRC"`
	Quantity2  byte   `json:"Quantity2"`
	CodecType  string `json:"CodecType"`
	Content    GPRS   `json:"Content"`
}

type GPRS struct {
	IsResponse  bool   `json:"isResponse"`
	Type        byte   `json:"type"`        // 6 = response
	ResponseStr string `json:"responseStr"` // Decoded ASCII or "New value..." string
}

func (m *Codec12CommandMessage) GetMeta() Meta {
	return m.Meta
}

func (m *Codec12CommandMessage) GetCodecID() uint8 {
	return m.CodecID
}

func (m *Codec12CommandMessage) GetQuantity1() uint8 {
	return m.Quantity1
}
