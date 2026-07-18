package report

import "testing"

// Each case pins one level of §11's priority order, including the two
// branches that are dead against current tracker data (pto and engine) —
// they are the contract with future tracker configurations.
func TestResolveActivity(t *testing.T) {
	tr, fa := true, false

	cases := []struct {
		name       string
		point      TelemetryPoint
		wantActive *bool
		wantSource ActivitySource
	}{
		{
			name:       "pto wins over everything",
			point:      TelemetryPoint{Parameters: map[string]any{"pto": true}, IgnitionOn: &fa},
			wantActive: &tr,
			wantSource: SourcePTO,
		},
		{
			name:       "pto as a 0/1 number",
			point:      TelemetryPoint{Parameters: map[string]any{"pto": float64(1)}},
			wantActive: &tr,
			wantSource: SourcePTO,
		},
		{
			name:       "engine_running before ignition",
			point:      TelemetryPoint{Parameters: map[string]any{"engine_running": true}, IgnitionOn: &fa},
			wantActive: &tr,
			wantSource: SourceEngine,
		},
		{
			name:       "ignition true",
			point:      TelemetryPoint{IgnitionOn: &tr},
			wantActive: &tr,
			wantSource: SourceIgnition,
		},
		{
			name:       "ignition FALSE is a real answer, not a fallthrough",
			point:      TelemetryPoint{IgnitionOn: &fa, ActivityOn: &tr},
			wantActive: &fa,
			wantSource: SourceIgnition,
		},
		{
			name:       "digital input when ignition unknown",
			point:      TelemetryPoint{ActivityOn: &tr},
			wantActive: &tr,
			wantSource: SourceDigitalInput,
		},
		{
			name:       "everything unknown stays unknown — nil, never false",
			point:      TelemetryPoint{},
			wantActive: nil,
			wantSource: SourceUnknown,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			active, source := ResolveActivity(tc.point)

			if source != tc.wantSource {
				t.Fatalf("source = %s, want %s", source, tc.wantSource)
			}
			switch {
			case tc.wantActive == nil && active != nil:
				t.Fatalf("active = %v, want nil", *active)
			case tc.wantActive != nil && active == nil:
				t.Fatalf("active = nil, want %v", *tc.wantActive)
			case tc.wantActive != nil && *active != *tc.wantActive:
				t.Fatalf("active = %v, want %v", *active, *tc.wantActive)
			}
		})
	}
}
