# Phase 3 — Pure Segmentation Engine (COMPLETE)

Archived verbatim from ROADMAP.md on 2026-07-19. Completed 2026-07-19.
Includes the cadence survey and the Step 8 live acceptance matrix.

## Phase 3 — Pure Segmentation Engine (§38 Phase 3, §12–§17, §22–§23, §43)

Deliverable: the engine turns `[]TelemetryPoint` into `segments + summary`,
and the response becomes the full §18/§19.3 `ActivityReportResponse`
(`report.mode`, `subject`, `summary`, `segments`) the frontend's swap seam
expects. Acceptance (§38): the fixture scenarios pass, traffic-light stops
stay inside journeys, active-static work is detected, gaps are never bridged
as routes, and the summary matches the segments.

### Ground truth — cadence survey (2026-07-18, the org-6 drive days)

- Median interval between points is **70s**, p90 **100s** — the default
  `maximumPointGapSeconds: 300` sits comfortably above normal cadence, and
  the two surveyed days contain **4 real gaps > 300s**: data_gap segments
  will appear in ordinary real reports, not just fixtures.
- Parked points (ignition 0) report **clean speed 0** on this tracker —
  scenario D's noise arrives through position jitter, not speed. A naive
  all-parked-points spread measure came back 112km — contaminated by
  multiple parking locations and 0,0 fixes; honest per-episode drift needs
  per-episode measurement, deferred to the fixtures step.
- `pto` / `engine_running` still absent from real data — active_static will
  only be exercisable through fixtures (scenario C) until a tracker config
  maps a work input. Scenario G (missing activity signal) is the REAL
  common case in production data.

### Step 0 — Shape decisions (docs only, before code)

- [x] Pin the segment types in `SPEC.md` the way TelemetryPoint was pinned:
      a Go interface-based union (each concrete type marshals its own §18
      fields with the `type` discriminator) — `JourneySegment`
      (distanceMeters, averageSpeedKph, maximumSpeedKph, start/endLocation,
      endReason, pointCount, points), `ActiveStaticSegment` (location,
      activitySource), `StationarySegment` (location), `DataGapSegment`
      (previous/nextLocation, NO points, NO route — §8.4), plus
      `ReportLocation`, `SegmentBoundary` (§43) and the §19.3 summary
      struct. Re-read the frontend type file field-for-field while writing;
      it is the authority, not memory.
- [x] Pin the §44 pre-pass: points arrive sorted (SQL) but the engine
      re-verifies order, drops exact duplicates, and SKIPS gpsValid=false
      points for all segmentation math (§17 pseudocode does the same).
      Consequence to record: invalid points appear in no segment — they
      exist only in the §37 counters once Phase 3 replaces the flat points
      array with segments.
- [x] Pin the §43 v1 boundary rule: compute within the window only;
      first/last segments touching the window edges get their boundary
      flags; the look-behind/look-ahead fetch widening is explicitly
      deferred (record as a Later item).
- [x] Pin mode handling: Phase 3 serves `mode: "journey"` for every tracker
      category; timeline mode for sparse assets (§4.2, scenario F) is its
      own later phase. `report.mode` says what was chosen (§4.3 auto stays
      internal).
- [x] `JourneyConfig` (§40) lives in `internal/report/config.go` as code
      (vehicle + personal profiles); per the Phase 1 decision, values get
      promoted to env vars only when real tuning demands it.
- Verify: SPEC reads coherently against §14–§18 and the frontend types.

### Step 1 — geometry and movement primitives

- [x] `haversineMeters(a, b TelemetryPoint) float64` (§22) — lives in
      report; the util-package trigger (a second consumer) has not fired.
- [x] `resolveMovement` (§12): moving when `speedKph >= movingSpeedKph` OR
      `distance >= minimumMovementMeters` OR `movementDetected == true`.
- [x] Movement confirmation (§13): `movementConfirmationPoints` consecutive
      moving points OR `movementConfirmationMeters` buffered — a journey
      must never start from one noisy point.
- [x] Unit tests: haversine against known coordinates, the confirmation
      rules, and a drift table (random jitter within 10m never confirms —
      scenario D's core).
- Verify: `go test ./internal/report`.

### Step 2 — segment types and metrics

- [x] `internal/report/segment.go` — the union from Step 0 with stable ids
      (`segment-1`, …), `durationSeconds`, and JSON marshal tests proving
      each type emits exactly its §18 fields (a DataGapSegment must never
      grow a points array).
- [x] Journey metrics: `distanceMeters` = haversine sum over its accepted
      points (§22), `averageSpeedKph` from distance/duration,
      `maximumSpeedKph` from point speeds.
- Verify: marshal tests against the frontend union, field for field.

### Step 3 — the state machine

- [x] `internal/report/engine.go` — `BuildSegments(points, config, from,
      to)`: the §17 pseudocode ported faithfully — pending movement and
      stationary buffers (§15), backdated boundaries (the journey ends at
      the true stop time, not threshold-seconds later), the gap
      short-circuit closing the current segment and restarting
      interpretation (§14.7), short stops staying buffered inside journeys
      (§14.2), and every §14.1–14.6 transition.
- [x] The §G decision the pseudocode dodges: with activity UNKNOWN (nil),
      a confirmed stop still becomes stationary after `journeyEndSeconds` —
      never an invented active_static; record the deviation from the
      pseudocode (which would buffer forever) in a comment citing §36.2 G.
- [x] `endReason` on every journey close (`became_active_static`,
      `became_stationary`, `data_gap`, `report_end`).
- [x] End-of-points: close the open segment at the last point; the window
      edge handling belongs to Step 4.
- Verify: compiles; the fixtures in Step 5 are the real check.

### Step 4 — window boundaries (§43 v1)

- [x] Clip segments to `[from, to]`; set `startsBeforeReportRange` /
      `endsAfterReportRange` on the edge segments per the Step 0 rule.
      (`window.go`: a post-pass after the state machine — segments wholly
      outside the window are dropped and survivors renumbered; a clipped
      segment trims its points to the window and recomputes what derives
      from them; a clipped gap keeps previousLocation/nextLocation.)
- [x] Durations reflect the clipped extent, so the summary reconciles to
      the covered window.
- Verify: unit test with a journey spanning the window start (the frontend
  fixture's `…` case). DONE — `window_test.go`: spanning-start,
  spanning-end, fully-inside untouched, wholly-outside dropped with the
  following gap clipped at the window edge.

### Step 5 — summary (§23)

- [x] `internal/report/summary.go` — derived from segments only, never from
      raw points: journeyCount, moving/activeStatic/stationary/gap seconds,
      totalDistanceMeters, pointCount. (Plus firstPointAt/lastPointAt from
      the segments' own points — null when empty, per the SPEC pin.)
- [x] The reconciliation invariant as a test: segment durations sum to the
      span they cover (the frontend mock's deriveSummary enforces the same).
      (`summary_test.go`: ordered non-overlapping segments, duration ==
      EndAt−StartAt everywhere, the four buckets partition total segment
      time; plus a full drive→work→gap→drive→parked timeline through the
      real engine with exact bucket numbers, and the empty summary
      marshalling firstPointAt/lastPointAt as null.)
- Verify: `go test ./internal/report`. DONE — full suite green.

### Step 6 — fixtures (§36.2)

- [x] Port the frontend mock's waypoint generator (`buildPoints` in
      `web.frontend.vue/src/mock/activity-report.mock.ts`, ~40 lines) into
      a Go testdata builder — self-contained tests, no node dependency; the
      mock stays the visual reference and this port is documented as its
      Go twin. (`scenario_test.go`: `pointOnPath` + the `track` builder —
      cadence-driven instead of count-driven so intervals stay under
      MaximumPointGapSeconds, with an optional position-frozen stop.)
- [x] Scenario C (the cherry-picker day) reproduced with the mock's exact
      timeline: journey → active_static (2h27m, source pto) → journey →
      stationary → journey → data_gap (30m) → journey → stationary, with
      the §43 partial flags at both window edges, exact start/end/duration
      on all 8 segments, end reasons, gap endpoints, and summary
      reconciliation. Two documented departures from the mock: the
      post-gap journey starts one cadence late (the §17 seed point), and
      the traffic light is 90s not 160s (see the tuning note under Later
      Phases — an ignition-on stop ≥ StaticConfirmationSeconds becomes
      active_static).
- [x] Hand-built tables for A (simple journey), B (45s traffic light stays
      one journey), D (10m jitter stays stationary), E (30m gap not
      bridged), G (no activity signal: journeys still form, stops become
      stationary, active_static never invented).
- [x] Scenario F (sparse tracker) is timeline mode — explicitly out of
      scope, listed under Later.
- Verify: `go test ./internal/report` — every scenario's expected segment
  sequence, types, and durations. DONE — all six scenario tests green.

### Step 7 — service wiring and the full response

- [x] `report_service.go`: after Normalize, run the engine and build the
      full `ActivityReportResponse` per the frontend contract file —
      `report` (mode, from, to), `subject`, `summary`, `segments`. The flat
      `points`/`rawPointCount` fields give way to the contract shape;
      re-check every field name against the frontend types, not memory.
      (Done: `ReportMeta` + camelCase `ReportSubject` with `trackerType`
      falling back to vehicle; `generatedAt`/`timezone` per the SPEC pin;
      the frontend types file re-read field-for-field before writing.)
- [x] Handler log gains `segment_count` (§37); raw count now sourced from
      `Stats.Raw` since `RawPointCount` left the response.
- [x] RUN_DB_TESTS integration test on the real drive window (the org-6
      asset, Jul 6–8): at least one journey found, gaps where the cadence
      survey says they are, summary consistent with segments.
      (`TestGenerateActivityReport_RealDriveWindow` — picks the busiest
      asset in the window, asserts journeys ≥ 1, gaps ≥ 1, and every
      summary field recomputed from the segments.)
- Verify: full suite + integration suites. DONE — both green against the
  live DB (read-only) on 2026-07-19.

### Step 8 — Phase 3 acceptance

- [x] The §38 criteria walked live: fixtures green, the traffic-light stop
      inside one journey (scenario B), active_static from scenario C, a
      real multi-hour gap served as data_gap with no route, summary
      matching segments on a real report. (The survey's exact 6249s gap is
      not in the Jul 6–8 window — the criterion was walked with org 6's
      real 31852s gap instead; same §8.4 substance.)
- [x] devserver smoke: real drive days served as segments; journey
      metrics plausible.
- [x] Build, vet, full suite; roadmap Current State updated; frontend
      swap-seam note refreshed (Phase 4 can now wire the UI —
      `web.frontend.vue/docs/features/ACTIVITY_REPORT_UI_ROADMAP.md`).
- Verify: matrix recorded here, boxes ticked. DONE — 2026-07-19:

  | Check (live, devserver 4404, PRODUCTION reads) | Result |
  |---|---|
  | IAN-680 (org 11), Jul 6–8: 200 in 1.1s | 3 segments: 2 journeys + 483s data_gap |
  | — summary vs segments (all 6 buckets, distance, points) | reconciles exactly |
  | — journeys 95.9km/205min avg 28.0 max 95; 336.5km/677min avg 29.8 max 95 | plausible |
  | — response envelope vs frontend types file | field-for-field match |
  | org-6 asset 74, Jul 6–8: real 31852s silence | served as data_gap, previous/nextLocation only, no points key |
  | — lone point between two back-to-back gaps | gaps contiguous at it, point in no segment (§17 seed) |
  | — summary reconciliation on that report | exact |
  | boundary flags | none — first/last points sit inside the window (correct) |
  | fixtures (§36.2 A/B/C/D/E/G) + full unit suite + vet | green |
