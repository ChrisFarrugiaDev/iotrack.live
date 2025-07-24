package util

import (
	"reflect"
	"testing"
)

func TestStringToHexBytes(t *testing.T) {
	input := "abc123"
	expected := []byte{'a', 'b', 'c', '1', '2', '3'}

	result := StringToHexBytes(input)

	if !reflect.DeepEqual(result, expected) {
		t.Errorf("StringToHexBytes(%q) = %v, want %v", input, result, expected)
	}
}

func TestByteLength(t *testing.T) {
	input := []byte{'a', 'b', 'c', '1', '2', '3'}
	expected := 6

	result := ByteLength(input)

	if expected != result {
		t.Errorf("ByteLength(%v) = %d; want %d", input, result, expected)
	}
}

func TestBytesToHexString(t *testing.T) {
	input := []byte("abc123")
	expected := "616263313233"

	result := BytesToHexString(input) // "a"=61, "b"=62, etc., in hex, all uppercase

	if result != expected {
		t.Errorf("BytesToHexString(%v) = %q; want %q", input, result, expected)
	}
}

/*
func BytesToHexString(b []byte) string {
	return strings.ToUpper(hex.EncodeToString(b))
}

*/
