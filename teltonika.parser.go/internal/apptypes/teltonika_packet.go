package apptypes

type TeltonikaPacket interface {
	GetCodecID() uint8
	GetQuantity1() uint8
	GetCodecType() string
}
