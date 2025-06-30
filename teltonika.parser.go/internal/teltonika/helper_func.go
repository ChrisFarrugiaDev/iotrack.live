package teltonika

import "fmt"

func assertCanRead(data []byte, offset int, need int, context string) error {
	if offset+need > len(data) {
		return fmt.Errorf("buffer too short for %s at offset %d", context, offset)
	}
	return nil
}
