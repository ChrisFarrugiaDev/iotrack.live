# Computation Server Roadmap

This file tracks the implementation work for `computation.server.go`.
`SPEC.md` remains the source of truth for the service role, contracts, and
expected runtime behavior; steps below reference it rather than repeat it.

Completed phases are archived **verbatim** under `docs/roadmap/` (step
checklists, ground-truth surveys, acceptance matrices) — this file carries
only what is current or still ahead.

## Current State

- **Phases 1–3 are COMPLETE (2026-07-19).** `POST /compute/reports/activity`
  serves the full §18/§19.3 `ActivityReportResponse` — `report` meta
  (mode journey, timezone UTC), camelCase `subject`, §23 `summary`,
  and the §18 segment union — behind the full JWT → `report.view` →
  org → asset-access → range-limit chain, accepted live against real
  drive days (summaries reconciling exactly, a real 31852s silence
  served as a data_gap with no route).
- Layering as specced: thin handlers → services → repositories (upper/db
  for the asset lookup, raw pgx elsewhere) → structs-only models → the
  pure `internal/report` engine (§14–§17 state machine, §43 v1 window
  clipping, §23 summary, §36.2 scenario fixtures).
- Tests: httptest tables (middlewares, handler), engine unit + scenario
  suites (no DB), RUN_DB_TESTS=1 read-only integration suites, and the
  per-phase acceptance matrices in the archives.
- **Next: Phase 4 — wire the frontend** (swap the store seam, Apache
  `/compute/` prefix, root Makefile `computation-build` target,
  `report.view` router map + sidebar gating). Write the detailed Phase 4
  step roadmap here before coding, as with every phase. See the frontend's
  `docs/features/ACTIVITY_REPORT_UI_ROADMAP.md` for the seam notes.

## Later Phases

Environment debt (raised 2026-07-19, when `57.129.22.122:5436` was
recognised as PRODUCTION, not a dev DB):

- [ ] Create a **read-only PostgreSQL role** for tooling and integration
      tests (`dbquery.sh`, `RUN_DB_TESTS`), so nothing routine can write to
      production even by accident.
- [ ] Build a **dev sandbox database** from production: schema via
      `initdb-scripts` in local Docker, plus an optional telemetry subset
      dump for realistic engine testing; point the dev tooling at it and
      retire the host-swap-to-production habit.

Threshold tuning (found while building the §36.2 fixtures, 2026-07-19 —
revisit with real telemetry, §40 says the defaults are starting values):

- [ ] An ignition-on stop ≥ `StaticConfirmationSeconds` (120s) becomes
      **active_static** via the §11 ignition fallback — a long red light
      or traffic queue reads as "working". Options when real data decides:
      a longer confirmation for ignition-sourced activity, or requiring a
      stronger §11 source (pto/engine_running/work input) for
      active_static.
- [ ] A single GPS spike ≥ `MinimumMovementMeters` (25m) yields TWO
      "moving" points (out and back), which meets
      `MovementConfirmationPoints` (2) and confirms a phantom journey.
      The 10m-jitter case is covered (scenario D test); a lone larger
      spike is not. Options: confirm on points AND meters, or a minimum
      journey distance.

Tracked in `SPEC.md` (Implementation Roadmap): Phase 4 wiring the frontend
(swap the store seam, Apache `/compute/` prefix, root Makefile
`computation-build` target, `report.view` gating in the sidebar), timeline
mode for sparse assets (§4.2, scenario F), the §43 look-behind/look-ahead
fetch widening, reverse geocoding (§28), groups (§19.2 — intersection,
never union), export, alarms, audit events (§35).

## Completed

Archived verbatim, checklists and matrices intact:

- [Phase 1 — API Skeleton and Access](docs/roadmap/01_phase_1_api_skeleton.md) —
  `POST /compute/reports/activity` behind the full auth/access chain, §34
  error shapes, the REPORT_MAX_CONCURRENT semaphore, §37 logging, Step 10
  curl acceptance matrix.
- [Phase 2 — Normalisation](docs/roadmap/02_phase_2_normalisation.md) — §10
  TelemetryPoint from raw rows (null never false, ibutton/rfid strings,
  gpsValid marked-not-dropped), §11 ResolveActivity, real-payload fixture
  tests. Holds the live-DB ground-truth survey (payload encodings,
  element ids).
- [Phase 3 — Pure Segmentation Engine](docs/roadmap/03_phase_3_segmentation_engine.md)
  — the §17 state machine, §43 v1 window clipping, §23 summary, §36.2
  scenario fixtures, service wiring to the full response, live acceptance.
  Holds the cadence survey and the Step 8 matrix.
