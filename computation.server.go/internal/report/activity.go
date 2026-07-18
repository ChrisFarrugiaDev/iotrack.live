package report

// ResolveActivity decides a point's activity state in the §11 priority
// order: explicit work input → engine running → ignition → device activity
// signal → unknown. Per-point and pure, which is why it lives here rather
// than with the Phase 3 engine.
//
// pto and engine_running do not exist in current tracker data (ground-truth
// survey) — today every resolution falls through to ignition or below. The
// branches stay: they are the contract with future tracker configurations,
// and removing them would silently change §11's priority order when such
// data appears.
//
// The report must distinguish active-true, active-false and active-UNKNOWN;
// a nil result is never collapsed to false (§41.4).
func ResolveActivity(point TelemetryPoint) (active *bool, source ActivitySource) {

	if isTrue(point.Parameters["pto"]) {
		return boolPtr(true), SourcePTO
	}

	if isTrue(point.Parameters["engine_running"]) {
		return boolPtr(true), SourceEngine
	}

	if point.IgnitionOn != nil {
		return point.IgnitionOn, SourceIgnition
	}

	// ActivityOn is the provisional digital_input_1 work signal — a device
	// input, hence digital_input rather than §11's device_activity, which
	// is reserved for a tracker's own activity state field.
	if point.ActivityOn != nil {
		return point.ActivityOn, SourceDigitalInput
	}

	return nil, SourceUnknown
}

// isTrue reads a parameter that may arrive as a real boolean or as the
// 0/1 numbers Teltonika uses for binary signals.
func isTrue(v any) bool {
	switch t := v.(type) {
	case bool:
		return t
	case float64:
		return t != 0
	default:
		return false
	}
}

func boolPtr(b bool) *bool { return &b }
