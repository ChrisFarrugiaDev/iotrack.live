package util

import "testing"

func TestBytesToUint8(t *testing.T) {
	b := byte(200)
	expected := uint8(200)
	result := BytesToUint8(b)
	if result != expected {
		t.Errorf("BytesToUint8(%v) = %d; want %d", b, result, expected)
	}
}

func TestBytesToInt8(t *testing.T) {
	b := byte(255) // 255 as int8 is -1
	expected := int8(-1)
	result := BytesToInt8(b)
	if result != expected {
		t.Errorf("BytesToInt8(%v) = %d; want %d", b, result, expected)
	}
}

func TestBytesToUint16(t *testing.T) {
	b := []byte{0x12, 0x34}
	expected := uint16(0x1234)
	result := BytesToUint16(b)
	if result != expected {
		t.Errorf("BytesToUint16(%v) = %d; want %d", b, result, expected)
	}
}

func TestBytesToInt16(t *testing.T) {
	b := []byte{0xFF, 0xFE} // 0xFFFE is -2 in int16
	expected := int16(-2)
	result := BytesToInt16(b)
	if result != expected {
		t.Errorf("BytesToInt16(%v) = %d; want %d", b, result, expected)
	}
}

func TestBytesToUint32(t *testing.T) {
	b := []byte{0x01, 0x23, 0x45, 0x67}
	expected := uint32(0x01234567)
	result := BytesToUint32(b)
	if result != expected {
		t.Errorf("BytesToUint32(%v) = %d; want %d", b, result, expected)
	}
}

func TestBytesToInt32(t *testing.T) {
	b := []byte{0xFF, 0xFF, 0xFF, 0xFE} // 0xFFFFFFFE is -2 in int32
	expected := int32(-2)
	result := BytesToInt32(b)
	if result != expected {
		t.Errorf("BytesToInt32(%v) = %d; want %d", b, result, expected)
	}
}

func TestBytesToUint64(t *testing.T) {
	b := []byte{0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF}
	expected := uint64(0x0123456789ABCDEF)
	result := BytesToUint64(b)
	if result != expected {
		t.Errorf("BytesToUint64(%v) = %d; want %d", b, result, expected)
	}
}

func TestBytesToHexPairsString(t *testing.T) {
	b := []byte{0x12, 0x34, 0x56}
	expected := "123456"
	result := BytesToHexPairsString(b)
	if result != expected {
		t.Errorf("BytesToHexPairsString(%v) = %s; want %s", b, result, expected)
	}
}

func TestIsPrintableASCII(t *testing.T) {
	printable := []byte("hello123!@#")
	if !IsPrintableASCII(printable) {
		t.Errorf("IsPrintableASCII(%v) = false; want true", printable)
	}
	notPrintable := []byte{0x01, 0x02, 0xFF}
	if IsPrintableASCII(notPrintable) {
		t.Errorf("IsPrintableASCII(%v) = true; want false", notPrintable)
	}
}
