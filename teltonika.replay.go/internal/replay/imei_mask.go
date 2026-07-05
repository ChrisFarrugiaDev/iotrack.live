package replay

import (
	"crypto/sha256"
	"encoding/binary"
	"fmt"
)

// MaskIMEI returns a deterministic fake IMEI: "999" + 12 decimal digits
// derived from the SHA-256 hash of the real IMEI. The result is always 15
// digits, starts with "999" (clearly synthetic), and the same real IMEI
// always produces the same fake IMEI. The mapping is one-way; enable
// REPLAY_META=true to persist an encrypted reverse-lookup table.
func MaskIMEI(imei string) string {
	h := sha256.Sum256([]byte(imei))
	n := binary.BigEndian.Uint64(h[:8]) % 1_000_000_000_000
	return fmt.Sprintf("999%012d", n)
}
