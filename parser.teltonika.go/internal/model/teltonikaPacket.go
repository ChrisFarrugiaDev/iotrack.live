package model

type TeltonikaPacket interface {
	GetMeta() Meta
	GetCodecID() uint8
	GetQuantity1() uint8
}
