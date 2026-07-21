package report

import (
	"fmt"
	"sort"
	"time"
)

// BuildSegments runs the §16/§17 state machine over normalised points and
// returns the §18 segment sequence. Pure: points and config in, segments
// out. The port follows §17's pseudocode with these documented choices
// where it is silent or sketchy:
//
//   - §44 pre-pass: points are re-sorted, same-timestamp duplicates keep
//     the first occurrence, and gpsValid=false points are skipped entirely
//     — they belong to no segment and exist only in the §37 counters.
//   - Buffered points are never silently lost (the pseudocode drops a
//     buffer whenever the opposite kind of point arrives): an invalidated
//     buffer is absorbed into the current segment when one exists — a
//     traffic-light stop's points stay inside the journey (§14.2), a
//     drift blip's points stay inside the stationary period. Only points
//     buffered before any segment exists are dropped, as in §17.
//   - §36.2 G: a confirmed stop with activity UNKNOWN becomes stationary
//     after StationaryConfirmationSeconds — never an invented active_static.
//     The pseudocode would buffer forever on nil activity.
//   - Transitions are contiguous by construction: the closing segment's
//     EndAt is the opening segment's StartAt (backdating per §15), and a
//     data gap spans exactly [previous point, next point].
//   - A window too short to confirm any state yields no segments, as in
//     §17. The §43 v1 boundary pass (clipToWindow) then clips the result
//     to [from, to] and flags the edge segments.
//   - §14.9: an elapsed-time gap (§14.7) is bridged, not gapped, when the
//     tracker didn't move beyond jitter and its activity signal doesn't
//     conflict across the silence — some trackers deliberately drop to an
//     infrequent heartbeat while parked instead of a real absence of data.
func BuildSegments(points []TelemetryPoint, cfg JourneyConfig, from, to time.Time) []ActivitySegment {
	pts := prepare(points)

	e := &engine{cfg: cfg}

	for _, point := range pts {
		e.step(point)
	}
	e.finish()

	return clipToWindow(e.segments, from, to)
}

// prepare is the §44 pre-pass: sort, drop same-timestamp duplicates, drop
// invalid fixes.
func prepare(points []TelemetryPoint) []TelemetryPoint {
	pts := make([]TelemetryPoint, 0, len(points))
	for _, p := range points {
		if p.GPSValid {
			pts = append(pts, p)
		}
	}

	sort.SliceStable(pts, func(i, j int) bool {
		return pts[i].Timestamp.Before(pts[j].Timestamp)
	})

	deduped := pts[:0]
	for i, p := range pts {
		if i > 0 && p.Timestamp.Equal(pts[i-1].Timestamp) {
			continue
		}
		deduped = append(deduped, p)
	}
	return deduped
}

// building is a segment under construction.
type building struct {
	kind    string // "journey" | "active_static" | "stationary"
	startAt time.Time
	points  []TelemetryPoint
	source  ActivitySource // active_static only
}

type engine struct {
	cfg      JourneyConfig
	segments []ActivitySegment

	current  *building
	previous *TelemetryPoint

	pendingMovement   []TelemetryPoint
	pendingStationary []TelemetryPoint

	// bridgedSilence is a one-shot marker set whenever a §14.9 bridge
	// spans a silence. The next stepStationary consumes it and demotes the
	// confirmation to plain stationary — a bridged silence claims only
	// what the position proves, never active_static (§14.9's attribution
	// rule): two endpoint samples don't prove hours of engine running.
	bridgedSilence bool
}

func (e *engine) step(point TelemetryPoint) {
	if e.previous == nil {
		// The first valid point only seeds distance/time deltas (§17); it
		// joins a segment only through a later buffer.
		p := point
		e.previous = &p
		return
	}

	elapsed := point.Timestamp.Sub(e.previous.Timestamp)
	distance := haversineMeters(*e.previous, point)

	gapByElapsedTime := elapsed > time.Duration(e.cfg.MaximumPointGapSeconds)*time.Second

	// §14.8: a second, independent gap trigger — a physically implausible
	// jump. Two points can be well under MaximumPointGapSeconds apart and
	// still be impossible (a GPS glitch, not real movement). The distance
	// floor (MinimumJumpMeters) keeps ordinary GPS reacquisition snap from
	// tripping it: found 2026-07-20 on real data (YSM-815), a ~330m snap
	// over 3s implies ~400 km/h and split a real journey with a
	// zero-duration data_gap. The gate is a teleport detector — km-scale
	// displacement — not a jitter detector. Disabled when
	// MaximumPlausibleSpeedKph is unset/zero. Neither trigger depends on
	// the other, and a jump is never bridged by §14.9 below — a real jump
	// always has a distance well past MinimumMovementMeters anyway.
	gapByImplausibleJump := e.cfg.MaximumPlausibleSpeedKph > 0 &&
		distance >= e.cfg.MinimumJumpMeters &&
		impliedSpeedKph(distance, elapsed) > e.cfg.MaximumPlausibleSpeedKph

	// §14.10: a silence too short for §14.7 can still hide too much road.
	// Found 2026-07-21 on real data (AFO-544): 235s of silence while
	// driving covered 1156m — under the elapsed-time threshold, implied
	// speed entirely plausible — and the report drew a straight "route"
	// across terrain the tracker never reported. §8.4 forbids assuming
	// direct travel between points; past MinimumJumpMeters of displacement
	// the interpolation is a fabrication, not a rendering shortcut. The
	// elapsed floor keeps normal dense cadence exempt — at the fleet's
	// ~10s cadence, covering 500m in one step would already trip §14.8.
	gapByRouteHole := elapsed >= time.Duration(e.cfg.MinimumRouteHoleSeconds)*time.Second &&
		distance >= e.cfg.MinimumJumpMeters

	if gapByImplausibleJump || gapByRouteHole {
		e.closeGapAndReset(point)
		return
	}

	moving := isMoving(point, distance, e.cfg)

	// §14.9: an elapsed-time gap alone doesn't mean "unknown" if the point
	// on the far side is itself non-moving — some trackers deliberately
	// drop to an infrequent heartbeat while parked (observed: ~6h) instead
	// of a real absence of data. `!moving` is what stands in for "didn't
	// move beyond jitter" (isMoving already checks distance against
	// MinimumMovementMeters, so no separate distance check is needed) —
	// and it matters for a second reason: two separate journeys can share
	// an endpoint by coincidence (scenario E), and that point's reported
	// speed still marks it moving, so it must never bridge and silently
	// stitch two journeys together across an unknown gap.
	//
	// Position alone decides — the activity signal deliberately does NOT
	// (revised 2026-07-20 against real data, YSM-815): a parked tracker's
	// wake bursts flickered ignition 1→0 within seconds, so every silence
	// boundary "conflicted" and an unmoved 47-minute parked period
	// shredded into data_gaps. data_gap means route unknown (§8.4); with
	// identical coordinates on both sides there is no unknown route.
	// Bridged pairs fall into the normal classification below, where the
	// already-large elapsed time trivially clears
	// StationaryConfirmationSeconds.
	if gapByElapsedTime && moving {
		e.closeGapAndReset(point)
		return
	}

	// A bridged silence claims only what the position proves: plain
	// stationary, never active_static. First found conflicted (2026-07-21,
	// ACA-448): driver parks 13:30, switches the engine off at 13:33 —
	// recorded — returns 15:26; the wake burst's first fix read ignition=1
	// and stamped the whole 1h52m silence "Working". Then found that even
	// AGREEING endpoints over-claim (AIC-497): heartbeats hours apart both
	// reading ignition-on stamped multi-hour silences as "Working" — two
	// isolated samples don't prove the engine ran throughout. The one-shot
	// flag makes stepStationary confirm the silence as stationary; dense
	// observed data (the points after the wake) remains the only path to
	// active_static.
	if gapByElapsedTime && !moving {
		e.bridgedSilence = true
	}

	if moving {
		e.stepMoving(point)
	} else {
		e.stepStationary(point)
	}

	p := point
	e.previous = &p
}

// closeGapAndReset is §14.7/§14.8/§14.9's shared gap action: the gap spans
// exactly [previous, point], no route through it is known. If the segment
// being closed is an already-confirmed stationary/active_static stop,
// closeCurrent finalises it as-is — the "keep separate" decision (§8.4)
// needs no special handling here, it's just the normal
// close-then-append-gap sequence every transition already uses.
func (e *engine) closeGapAndReset(point TelemetryPoint) {
	e.closeCurrent(e.previous.Timestamp, "data_gap")
	e.appendGap(*e.previous, point)
	e.pendingMovement = nil
	e.pendingStationary = nil
	p := point
	e.previous = &p
}

func (e *engine) stepMoving(point TelemetryPoint) {
	// A stationary buffer interrupted by movement: a short stop. Its points
	// belong to the segment that continued through it (§14.2) — absorbed,
	// not dropped.
	e.absorbPending(&e.pendingStationary)

	e.pendingMovement = append(e.pendingMovement, point)

	if !movementConfirmed(len(e.pendingMovement), bufferedMeters(e.pendingMovement), e.cfg) {
		return
	}

	if e.current == nil || e.current.kind != "journey" {
		// §14.1/§14.5: the journey starts at the first buffered moving
		// point; whatever preceded it ends there.
		startAt := e.pendingMovement[0].Timestamp
		reason := "became_stationary" // unused label for non-journey closes
		e.closeCurrent(startAt, reason)

		e.current = &building{
			kind:    "journey",
			startAt: startAt,
			points:  append([]TelemetryPoint(nil), e.pendingMovement...),
		}
	} else {
		e.current.points = append(e.current.points, e.pendingMovement...)
	}

	e.pendingMovement = nil
}

func (e *engine) stepStationary(point TelemetryPoint) {
	// A movement buffer that never confirmed: a drift blip. Its points stay
	// with the current segment, not in limbo.
	e.absorbPending(&e.pendingMovement)

	e.pendingStationary = append(e.pendingStationary, point)

	stationarySeconds := int(point.Timestamp.Sub(e.pendingStationary[0].Timestamp).Seconds())
	active, source := ResolveActivity(point)

	// §14.9 attribution: this point closed a bridged silence. The buffer
	// about to confirm spans that silence, so it may claim only what the
	// position proves — plain stationary. The point's own (post-wake)
	// activity counts again from the next point on.
	if e.bridgedSilence {
		e.bridgedSilence = false
		f := false
		active, source = &f, SourceUnknown
	}

	switch {
	case active != nil && *active && stationarySeconds >= e.cfg.StationaryConfirmationSeconds:
		// §14.3: stationary but working. Backdate to the stop's start.
		if e.current == nil || e.current.kind != "active_static" {
			startAt := e.pendingStationary[0].Timestamp
			e.closeCurrent(startAt, "became_active_static")
			e.current = &building{
				kind:    "active_static",
				startAt: startAt,
				points:  append([]TelemetryPoint(nil), e.pendingStationary...),
				source:  source,
			}
		} else {
			e.current.points = append(e.current.points, e.pendingStationary...)
		}
		e.pendingStationary = nil

	// §14.4 for activity=false; §36.2 G for activity unknown: a confirmed
	// stop without a work signal is stationary — active_static is never
	// invented. (§17's pseudocode would buffer nil-activity forever.)
	case (active == nil || !*active) && stationarySeconds >= e.cfg.StationaryConfirmationSeconds:
		if e.current == nil || e.current.kind != "stationary" {
			startAt := e.pendingStationary[0].Timestamp
			e.closeCurrent(startAt, "became_stationary")
			e.current = &building{
				kind:    "stationary",
				startAt: startAt,
				points:  append([]TelemetryPoint(nil), e.pendingStationary...),
			}
		} else {
			e.current.points = append(e.current.points, e.pendingStationary...)
		}
		e.pendingStationary = nil

	default:
		// Short stop (§14.2) — stays buffered until its nature is known.
	}
}

// absorbPending moves an invalidated buffer into the current segment, or
// drops it when no segment exists yet (§17 behaviour for pre-segment
// points).
func (e *engine) absorbPending(buffer *[]TelemetryPoint) {
	if len(*buffer) == 0 {
		return
	}
	if e.current != nil {
		e.current.points = append(e.current.points, *buffer...)
	}
	*buffer = nil
}

// finish closes whatever remains at the end of the points. Trailing
// buffered points are absorbed first, so a journey ending in an
// unconfirmed short stop keeps those points (§14.2).
func (e *engine) finish() {
	e.absorbPending(&e.pendingStationary)
	e.absorbPending(&e.pendingMovement)

	if e.current != nil && len(e.current.points) > 0 {
		last := e.current.points[len(e.current.points)-1].Timestamp
		e.closeCurrent(last, "report_end")
	}
}

// closeCurrent finalises the building segment at the given boundary time.
// endReason applies only when the closing segment is a journey.
func (e *engine) closeCurrent(endAt time.Time, endReason string) {
	if e.current == nil {
		return
	}

	b := e.current
	e.current = nil

	base := SegmentBase{
		ID:              fmt.Sprintf("segment-%d", len(e.segments)+1),
		Type:            b.kind,
		StartAt:         b.startAt,
		EndAt:           endAt,
		DurationSeconds: int(endAt.Sub(b.startAt).Seconds()),
	}

	switch b.kind {
	case "journey":
		distance, avg, max := journeyMetrics(b.points, base.DurationSeconds)
		e.segments = append(e.segments, JourneySegment{
			SegmentBase:     base,
			DistanceMeters:  distance,
			AverageSpeedKph: avg,
			MaximumSpeedKph: max,
			StartLocation:   locationOf(b.points[0]),
			EndLocation:     locationOf(b.points[len(b.points)-1]),
			PointCount:      len(b.points),
			Points:          b.points,
			EndReason:       endReason,
		})

	case "active_static":
		e.segments = append(e.segments, ActiveStaticSegment{
			SegmentBase:    base,
			Location:       locationOf(b.points[0]),
			PointCount:     len(b.points),
			Points:         b.points,
			ActivitySource: b.source,
		})

	case "stationary":
		e.segments = append(e.segments, StationarySegment{
			SegmentBase: base,
			Location:    locationOf(b.points[0]),
			PointCount:  len(b.points),
			Points:      b.points,
		})
	}
}

func (e *engine) appendGap(previous, next TelemetryPoint) {
	prevLoc, nextLoc := locationOf(previous), locationOf(next)

	e.segments = append(e.segments, DataGapSegment{
		SegmentBase: SegmentBase{
			ID:              fmt.Sprintf("segment-%d", len(e.segments)+1),
			Type:            "data_gap",
			StartAt:         previous.Timestamp,
			EndAt:           next.Timestamp,
			DurationSeconds: int(next.Timestamp.Sub(previous.Timestamp).Seconds()),
		},
		PreviousLocation: &prevLoc,
		NextLocation:     &nextLoc,
	})
}

// bufferedMeters is the cumulative distance across a buffer's consecutive
// points (§13). A single buffered point contributes nothing — which is
// exactly why one isolated GPS spike can never confirm a journey.
func bufferedMeters(points []TelemetryPoint) float64 {
	var meters float64
	for i := 1; i < len(points); i++ {
		meters += haversineMeters(points[i-1], points[i])
	}
	return meters
}
