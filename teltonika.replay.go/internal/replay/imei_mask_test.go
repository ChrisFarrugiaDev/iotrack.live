package replay

import (
	"strings"
	"testing"
)

func TestMaskIMEI_Format(t *testing.T) {
	got := MaskIMEI(imeiA)
	if len(got) != 15 {
		t.Errorf("MaskIMEI length = %d, want 15", len(got))
	}
	if !strings.HasPrefix(got, "999") {
		t.Errorf("MaskIMEI = %q, want prefix \"999\"", got)
	}
}

func TestMaskIMEI_Deterministic(t *testing.T) {
	a := MaskIMEI(imeiA)
	b := MaskIMEI(imeiA)
	if a != b {
		t.Errorf("MaskIMEI not deterministic: %q vs %q", a, b)
	}
}

func TestMaskIMEI_Distinct(t *testing.T) {
	a := MaskIMEI(imeiA)
	b := MaskIMEI(imeiB)
	c := MaskIMEI(imeiC)
	if a == b || a == c || b == c {
		t.Errorf("MaskIMEI collision: %q %q %q", a, b, c)
	}
}
