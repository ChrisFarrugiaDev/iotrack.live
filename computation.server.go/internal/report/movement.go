package report

import "math"

const earthRadiusMeters = 6371000

// haversineMeters is the great-circle distance between two fixes (§22).
// Good to well under 0.5% at fleet scales, which is more precision than
// the GPS fixes themselves carry.
func haversineMeters(a, b TelemetryPoint) float64 {
	const rad = math.Pi / 180

	lat1 := a.Latitude * rad
	lat2 := b.Latitude * rad
	dLat := (b.Latitude - a.Latitude) * rad
	dLng := (b.Longitude - a.Longitude) * rad

	h := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*math.Sin(dLng/2)*math.Sin(dLng/2)

	return 2 * earthRadiusMeters * math.Asin(math.Sqrt(h))
}

// isMoving decides whether a single point is in motion (§12): reported
// speed, distance covered since the previous valid point, or the tracker's
// own movement flag. Any one indicator is enough — but a single moving
// point never starts a journey on its own; that needs confirmation below.
func isMoving(point TelemetryPoint, distanceFromPrevMeters float64, cfg JourneyConfig) bool {
	if point.SpeedKph != nil && *point.SpeedKph >= cfg.MovingSpeedKph {
		return true
	}
	if distanceFromPrevMeters >= cfg.MinimumMovementMeters {
		return true
	}
	return point.MovementDetected != nil && *point.MovementDetected
}

// movementConfirmed decides whether buffered movement is real (§13): enough
// consecutive moving points, or enough cumulative distance. GPS drift on a
// parked vehicle produces isolated "moving" blips; confirmation is what
// keeps them from becoming one-point journeys (§36.2 scenario D).
func movementConfirmed(bufferedPoints int, bufferedMeters float64, cfg JourneyConfig) bool {
	return bufferedPoints >= cfg.MovementConfirmationPoints ||
		bufferedMeters >= cfg.MovementConfirmationMeters
}
