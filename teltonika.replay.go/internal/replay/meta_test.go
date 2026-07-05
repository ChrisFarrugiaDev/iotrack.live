package replay

import (
	"crypto/sha256"
	"encoding/hex"
	"testing"
	"time"
)

func testEncKey() [32]byte {
	var key [32]byte
	copy(key[:], "test-32-byte-key-for-unit-tests!")
	return key
}

func TestMetaServiceRecordIMEI_StoresDecryptableRecord(t *testing.T) {
	key := testEncKey()
	meta := NewMetaService(nil, key, time.Hour)

	real := imeiA
	masked := MaskIMEI(real)
	meta.RecordIMEI(real, masked)

	meta.mu.RLock()
	rec, ok := meta.imeiMap[masked]
	meta.mu.RUnlock()

	if !ok {
		t.Fatal("RecordIMEI: no record found in imeiMap")
	}

	// Hash must match hex(SHA-256(real)).
	h := sha256.Sum256([]byte(real))
	wantHash := hex.EncodeToString(h[:])
	if rec.hash != wantHash {
		t.Errorf("hash = %q, want %q", rec.hash, wantHash)
	}

	// Encrypted value must decrypt back to the real IMEI.
	got, err := DecryptIMEI(key, rec.encrypted)
	if err != nil {
		t.Fatalf("DecryptIMEI: %v", err)
	}
	if got != real {
		t.Errorf("decrypted = %q, want %q", got, real)
	}
}

func TestMetaServiceRecordIMEI_Idempotent(t *testing.T) {
	key := testEncKey()
	meta := NewMetaService(nil, key, time.Hour)

	real := imeiA
	masked := MaskIMEI(real)

	meta.RecordIMEI(real, masked)
	meta.mu.RLock()
	first := meta.imeiMap[masked].firstSeen
	meta.mu.RUnlock()

	meta.RecordIMEI(real, masked)
	meta.mu.RLock()
	count := len(meta.imeiMap)
	second := meta.imeiMap[masked].firstSeen
	meta.mu.RUnlock()

	if count != 1 {
		t.Errorf("imeiMap len = %d, want 1 (idempotent)", count)
	}
	if first != second {
		t.Errorf("firstSeen changed on second RecordIMEI call")
	}
}

func TestDecryptIMEI_WrongKey(t *testing.T) {
	key := testEncKey()
	meta := NewMetaService(nil, key, time.Hour)
	meta.RecordIMEI(imeiA, MaskIMEI(imeiA))

	meta.mu.RLock()
	encrypted := meta.imeiMap[MaskIMEI(imeiA)].encrypted
	meta.mu.RUnlock()

	var wrongKey [32]byte
	copy(wrongKey[:], "wrong-key-32-bytes-exactly-here!")
	_, err := DecryptIMEI(wrongKey, encrypted)
	if err == nil {
		t.Error("expected decryption error with wrong key")
	}
}
