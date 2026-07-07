package teltonika

import "fmt"

// assertCanRead is the bounds guard used before every read: it fails if there
// are fewer than `need` bytes left from `offset`. (ref:032)
func assertCanRead(data []byte, offset int, need int, context string) error {
	if offset+need > len(data) {
		return fmt.Errorf("buffer too short for %s at offset %d", context, offset)
	}
	return nil
}
