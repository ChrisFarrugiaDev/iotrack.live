package apptypes

import "testing"

func TestFlatAvlRecord_DeepCopy_independence(t *testing.T) {
	original := FlatAvlRecord{
		Timestamp: "2025-06-04T09:51:58.010Z",
		Speed:     60,
		Elements:  map[string]any{"ignition": 1, "voltage": 12.5},
	}

	copied := original.DeepCopy()

	// Mutate original Elements — copy must not be affected.
	original.Elements["ignition"] = 0
	original.Elements["new_key"] = "should not appear in copy"

	if copied.Elements["ignition"] != 1 {
		t.Errorf("expected ignition=1 in copy, got %v", copied.Elements["ignition"])
	}
	if _, exists := copied.Elements["new_key"]; exists {
		t.Error("copy should not contain new_key added to original after DeepCopy")
	}
}

func TestFlatAvlRecord_DeepCopy_nilElements(t *testing.T) {
	original := FlatAvlRecord{Timestamp: "2025-06-04T09:51:58.010Z"}
	copied := original.DeepCopy() // must not panic
	if copied.Elements != nil {
		t.Error("expected nil Elements in copy of record with nil Elements")
	}
}
