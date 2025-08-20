package util

import (
	"bytes"
	"os"
	"strings"
	"testing"
)

func TestPtr(t *testing.T) {

	i := 42
	pi := Ptr(i)

	// Does the pointer point to the correct value?
	if pi != nil && *pi != i {
		t.Errorf("Ptr(%d) returned pointer to %d, expected pointer to %d", i, *pi, i)
	}
}

func TestPrettyPrint(t *testing.T) {
	// Arrange: a simple struct to print
	type Person struct {
		Name string
		Age  int
	}

	input := Person{Name: "Alice", Age: 30}

	// Save the original stdout
	origStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	// Act: call PrettyPrint, which prints to stdout
	PrettyPrint(input)

	// Restore stdout
	w.Close()
	os.Stdout = origStdout

	// Read captured output
	var buf bytes.Buffer
	_, err := buf.ReadFrom(r)

	if err != nil {
		t.Fatalf("Failed to read from pipe: %v", err)
	}

	output := buf.String()

	// Assert: output contains expected JSON
	if !strings.Contains(output, `"Name": "Alice"`) || !strings.Contains(output, `"Age": 30`) {
		t.Errorf("PrettyPrint output missing expected values. Output:\n%s", output)
	}

}
