package model

type Meta struct {
	IMEI    string  `json:"imei"`
	AssetID *string `json:"asset_id,omitempty"` // pointer if asset_id can be missing
}

// AvlDataPacket is the root structure for a decoded Codec8 packet
type AvlDataPacket struct {
	Meta       Meta    `json:"meta"`
	Packet     string  `json:"packet"`
	Preamble   uint32  `json:"preamble"`
	DataLength uint32  `json:"data_length"`
	CodecID    uint8   `json:"codec_id"`
	CodecType  string  `json:"codec_type"`
	Quantity1  uint8   `json:"quantity1"`
	Content    Content `json:"content"`
	Quantity2  uint8   `json:"quantity2"`
	CRC        uint32  `json:"crc"`
}

// Content wraps the records (for output parity)
type Content struct {
	AVL_Datas []AvlData `json:"avl_datas"`
}

// AvlData represents a single AVL data record
type AvlData struct {
	Timestamp  string     `json:"timestamp"` // ISO 8601 format (e.g. 2025-06-04T09:51:58.010Z)
	Priority   uint8      `json:"priority"`
	GPSelement GPSelement `json:"gps_element"`
	IOelement  IOelement  `json:"io_element"`
}

// GPSelement groups all GPS data in one record
type GPSelement struct {
	Longitude  float64 `json:"longitude"`
	Latitude   float64 `json:"latitude"`
	Altitude   int16   `json:"altitude"`
	Angle      uint16  `json:"angle"`
	Satellites uint8   `json:"satellites"`
	Speed      uint16  `json:"speed"`
}

// IOelement holds IO data for each record
type IOelement struct {
	EventID      int            `json:"event_id"`
	ElementCount int            `json:"element_count"`
	Elements     map[string]any `json:"elements"` // use any for flexibility (could be int or string)
}

type FlatAvlRecord struct {
}
