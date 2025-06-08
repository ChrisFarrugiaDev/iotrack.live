package util

// Helpers to convert byte slices to integer types

func BytesToUint8(b byte) uint8 {
	// Use when protocol says "unsigned byte" (0..255)
	// This func is not need it. Since in Go a single byte already fits the uint8 type.
	return uint8(b)
}

func BytesToInt8(b byte) int8 {
	// Use when protocol says "signed byte" (-128..127)
	return int8(b)
}

func BytesToUint16(b []byte) uint16 {
	// Use for 2-byte unsigned (big endian)
	return uint16(b[0])<<8 | uint16(b[1])
}

func BytesToInt16(b []byte) int16 {
	// Use for 2-byte signed (big endian)
	return int16(b[0])<<8 | int16(b[1])
}

func BytesToUint32(b []byte) uint32 {
	// Use for 4-byte unsigned (big endian)
	return uint32(b[0])<<24 | uint32(b[1])<<16 | uint32(b[2])<<8 | uint32(b[3])
}

func BytesToInt32(b []byte) int32 {
	// Use for 4-byte signed (big endian)
	return int32(BytesToUint32(b))
}

func BytesToUint64(b []byte) uint64 {
	// Use for 8-byte unsigned (big endian)
	return uint64(b[0])<<56 | uint64(b[1])<<48 | uint64(b[2])<<40 | uint64(b[3])<<32 |
		uint64(b[4])<<24 | uint64(b[5])<<16 | uint64(b[6])<<8 | uint64(b[7])
}
