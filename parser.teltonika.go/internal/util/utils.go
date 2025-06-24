package util

import (
	"encoding/json"
	"fmt"
)

// Ptr returns a pointer to the given value.
// Useful for getting a pointer to a literal or value inline, e.g. util.Ptr("foo").
func Ptr[T any](v T) *T {
	return &v
}

func PrettyPrint(v interface{}) {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(string(b))
}
