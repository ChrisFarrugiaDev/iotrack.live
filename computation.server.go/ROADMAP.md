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
- **Next: Phase 4 — wire the frontend.** The detailed step roadmap is
  below (Step 0 decisions → packaging → deploy/Apache → store seam swap →
  report.view gating → browser acceptance). Work on branch
  `feat/computation-phase4`. Step 0 is docs-only and must land before any
  code, as with every phase.

## Phase 4 — Wire the Frontend (§38 Phase 4)

Deliverable: the Activity Report page renders REAL telemetry end to end in
the browser — login → sidebar (gated) → report page → live segments on the
map/slider/table — with the compute service deployed on the box behind
Apache. First phase that crosses service boundaries: steps touch
`computation.server.go` (packaging), the repo root (compose, Makefile,
Apache conf), and `web.frontend.vue` (store seam, router, sidebar).

At a glance — the work shifts to `web.frontend.vue` at Step 3, once the
service is actually reachable at `https://iotrack.live/compute/`:

| Step | Where | What |
|---|---|---|
| 0 — Decisions | docs only | Seam URL (same-origin `/compute/...`), `{success, data}` unwrap + §34 error UX, timeline-mock fate, loading state |
| 1 — Packaging | `computation.server.go` + repo root | Dockerfile, `computation-server-go` compose block, `computation-build` Makefile target |
| 2 — Deploy | the box | Apache `/compute/` ProxyPass, `make sync`, compose up, smoke `https://iotrack.live/compute/health` |
| 3 — Seam swap | `web.frontend.vue` | `activityReportStore.fetchActivityReport()` — mock block → real axios call |
| 4 — Gating | `web.frontend.vue` | `'reports.activity': 'report.view'` in the router map + sidebar `v-if` |
| 5 — Acceptance | browser | Real drive day end to end, `/deploy-frontend`, docs closed out |

No separate frontend roadmap for Steps 3–4: this file is the single
tracker (the UI roadmap says so and records UI-side state only); those
steps tick the existing items in the frontend docs as sub-tasks.

Ground truth (read 2026-07-19 from the actual files — re-verify if stale):

- Services run in **Docker Compose** on the box; each Go service has a
  `Dockerfile` and a compose block (`DOCKERIZED=true`, env from compose,
  `DB_URL` pointing at the `postgres` service). `computation.server.go`
  has **neither yet** — packaging is the real deploy gap.
- Frontend service calls are **same-origin** through the Apache prefixes:
  `${useAppStore().getAppUrl}/api/...` (the per-port env vars exist in
  `.env` but the port composition in `appStore` is commented out). So the
  seam URL is `${getAppUrl}/compute/reports/activity` — NOT the
  `/api/reports/activity` in the store's old TODO comment.
- The store seam (`activityReportStore.fetchActivityReport`, one marked
  mock block) currently serves TWO mocks: `mockActivityReport` (journey)
  and `mockTimelineReport` — timeline mode does not exist in the backend
  (scenario F, Later).
- Gating patterns: router `routePermissions` map; sidebar items use
  `v-if="authorizationStore.can('<key>')"`. The `reports.activity` route
  exists with `requiresAuth` only; the Reports sidebar button is ungated.
- The backend response arrives wrapped in `{ success, data }`;
  `report.timezone` is `"UTC"` pending §42 Q14.

### Step 0 — Decisions (docs only, before code)

- [ ] Pin the seam URL: same-origin `${getAppUrl}/compute/reports/activity`
      (matches how every other store calls services; no `VITE_COMPUTE_PORT`
      needed — record why, and correct SPEC's Platform Placement note about
      it).
- [ ] Pin the envelope handling: the store unwraps `{ success, data }` and
      maps §34 error codes (`ASSET_NOT_FOUND`, `ASSET_ACCESS_DENIED`,
      `REPORT_VALIDATION_ERROR`, `REPORT_RANGE_TOO_LONG`) to the page's
      error state — decide the UX for each (message vs redirect).
- [ ] Decide the timeline-mock fate: backend serves journey mode for every
      tracker category, so the timeline branch in the store either goes
      away with the swap (report renders whatever `report.mode` says —
      preferred, keeps one seam) or stays mock-only behind a dev flag.
      The mock FILE stays either way — it is the §36.2 visual reference.
- [ ] Decide request timing: the compute call can take ~1–2s on a heavy
      window — confirm the page's existing loading state covers it.
- Verify: decisions recorded here + SPEC updated; no code yet.

### Step 1 — Backend packaging (Dockerfile, compose, Makefile)

- [ ] `computation.server.go/Dockerfile` — modelled on `file.server.go`'s
      (CGO_ENABLED=0 static build of `./cmd/app`; no uploads volume).
- [ ] `docker-compose.yml` service block `computation-server-go`, modelled
      on `file-server-go`: port `4004`, `DOCKERIZED=true`,
      `GO_ENV=production`, `LOG_MODE` + log bind-mount, `DB_URL` at
      `postgres:5432`, `JWT_SECRET`, pool sizing, and the report env
      (`REPORT_MAX_CONCURRENT`, `REPORT_MAX_RANGE_DAYS_*`) — values from
      SPEC's Configuration table.
- [ ] Root `Makefile` gains `computation-build` (mirrors
      `file-server-build`: `CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build
      -o computation-server ./cmd/app`).
- Verify: `make computation-build` produces a binary; `docker compose
  config` validates; local `docker build computation.server.go` succeeds.

### Step 2 — Deploy and public routing (on the box)

- [ ] Apache `web.frontend.vue/iotrack.live.conf`: the `/compute/`
      ProxyPass pair (SPEC Platform Placement has the exact lines), placed
      with the other prefixes; reload Apache on the box.
- [ ] `make sync`, then on the box: compose build + up for the new
      service; confirm it boots against the CO-LOCATED production DB
      (compose-internal `postgres:5432`, not the host-swap URL).
- [ ] Smoke through the public origin: `curl
      https://iotrack.live/compute/health` → 200; an authed report request
      with a real browser token → 200 segments (compute-dev-check's token
      minting works only for dev — use a token from a real login here).
- Verify: health + one real report served through Apache, §37 log line on
  the box.

### Step 3 — Swap the store seam

- [ ] `activityReportStore.fetchActivityReport()`: replace the mock block
      with `axios.post(`${useAppStore().getAppUrl}/compute/reports/activity`,
      payload)`, unwrap `{ success, data }`, keep the store's public shape
      unchanged (no component may notice the swap — that was the seam's
      whole point).
- [ ] §34 error codes mapped per Step 0; network/500 fall back to the
      generic error state.
- [ ] Remove the `mockActivityReport` import per the Step 0 decision;
      `mock/activity-report.mock.ts` itself stays.
- Verify: `npm run build` (type-check is the contract test — the response
  types are already transcribed from §18/§19.3); report page renders real
  data in dev against the deployed service.

### Step 4 — Gate the UI on report.view

- [ ] Router: `'reports.activity': 'report.view'` in `routePermissions`;
      drop the placeholder comment on the route.
- [ ] Sidebar: `v-if="authorizationStore.can('report.view')"` on the
      Reports button (same pattern as org/user/group/device/asset items).
- [ ] Close the "security debt" item in the frontend ROADMAP and the UI
      roadmap's remaining checklist entries.
- Verify: `npm run build`; a role holding `report.view` sees Reports, a
  role stripped of it (revoke on a test user via the Node UI, or a role-77
  style token) gets no sidebar item and a router redirect.

### Step 5 — Phase 4 acceptance

- [ ] End to end in the browser on production data: login → Reports →
      Activity Report → a real drive day renders — journeys on the map,
      slider bands matching the table, a data_gap drawn as a gap (never a
      route line), summary tiles consistent with segments.
- [ ] The §43 partial-flag rendering spot-checked (a window starting
      mid-journey shows the `…` boundary treatment).
- [ ] `/deploy-frontend` for the UI; docs updated: this file's Current
      State, the frontend ROADMAP + UI roadmap, SPEC status.
- Verify: acceptance walk recorded here, boxes ticked.

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
