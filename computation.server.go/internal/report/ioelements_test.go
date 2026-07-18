package report

import "testing"

func TestIoElementName(t *testing.T) {
	cases := []struct {
		id   string
		want string
	}{
		{"239", "ignition"},
		{"240", "movement"},
		{"78", "ibutton"},
		{"207", "rfid"},
		{"1", "digital_input_1"},
		// Unknown ids pass through under their numeric key — never dropped,
		// never renamed by guesswork.
		{"9999", "9999"},
		{"385", "385"},
	}

	for _, tc := range cases {
		if got := ioElementName(tc.id); got != tc.want {
			t.Errorf("ioElementName(%q) = %q, want %q", tc.id, got, tc.want)
		}
	}
}
