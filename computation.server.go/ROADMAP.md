# Computation Server Roadmap

This file tracks the implementation work for `computation.server.go`.
`SPEC.md` remains the source of truth for the service role, contracts, and
expected runtime behavior; steps below reference it rather than repeat it.

Completed phases are archived **verbatim** under `docs/roadmap/` (step
checklists, ground-truth surveys, acceptance matrices) — this file carries
only what is current or still ahead.

## Current State

- **Fixed 2026-07-21:** the org check in `GenerateActivityReport`
  (`internal/services/report_service.go`) was a flat
  `asset.OrganisationID != req.OrgID` comparison — an asset in a
  descendant/child organisation of the caller's own org was wrongly
  denied ("You do not have access to the selected asset."), even though
  it's correctly visible in the frontend's picker (`assetStore`, built
  from `web.backend.node.ts`'s real org-scope computation). Now mirrors
  Node's `computeAccessibleOrganisationIds` exactly: a new
  `OrganisationRepository` (`GetOrgScope` — recursive CTE on
  `parent_org_id`, `GetUserOrgOverrides`) plus a `mergeScopeWithOverrides`
  helper in `report_service.go` (allow applied first, deny always wins
  last), checked via `slices.Contains(orgScope, asset.OrganisationID)`.
  Covered by `TestGenerateActivityReport_DescendantOrgIsAllowed`
  (`internal/services/report_service_test.go`), verified read-only
  against production.
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

- [x] Pin the seam URL: same-origin `${getAppUrl}/compute/reports/activity`
      (matches how every other store calls services; no `VITE_COMPUTE_PORT`
      needed). DECIDED 2026-07-19. Correct SPEC's Platform Placement note
      when Step 3 lands.
- [x] Envelope handling: the store unwraps `{ success, data }`; §34 error
      codes (`ASSET_NOT_FOUND`, `ASSET_ACCESS_DENIED`,
      `REPORT_VALIDATION_ERROR`, `REPORT_RANGE_TOO_LONG`) render as an
      **inline message in the report area** — the page stays put, the
      user's asset/date selection survives for a retry. DECIDED
      2026-07-19.
- [x] Timeline-mock fate: **Option B — keep the timeline branch mock-only
      behind a dev flag** at the swap; journey requests go real. Chosen
      because timeline mode is promoted to **Phase 6** (below) with real
      device data incoming — the dev branch has a scheduled death: Phase 6
      Step "remove the dev flag" deletes it. The mock FILE stays either
      way — it is the §36.2 visual reference. DECIDED 2026-07-19.
- Verify: decisions recorded here; no code yet. DONE 2026-07-19 — all
  three decisions pinned. (The loading-state check moved to Step 3: it
  needs the real page against the real backend.)

### Step 1 — Backend packaging (Dockerfile, compose, Makefile)

- [x] `computation.server.go/Dockerfile` — modelled on
      `teltonika.parser.go`'s (alpine base, CGO_ENABLED=0 static binary
      copy, no uploads volume; no C-library runtime deps needed, unlike
      `file.server.go`'s bimg).
- [x] `docker-compose.yml` service block `computation-server-go`, modelled
      on `file-server-go`: port `4004` (`COMPUTATION_HTTP_PORT`),
      `DOCKERIZED=true`, `GO_ENV=production`, `LOG_MODE=file` + log
      bind-mount, `DB_URL` at `postgres:5432`, `JWT_SECRET`, pool sizing,
      and the report env (`REPORT_MAX_CONCURRENT`,
      `REPORT_MAX_RANGE_DAYS_*`) — values from SPEC's Configuration table,
      new vars added to root `.env`. Only depends on `postgres` (no
      redis/rabbitmq — this service doesn't use them).
- [x] Root `Makefile` gains `computation-build` (mirrors
      `file-server-build`: `CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build
      -o computation-server ./cmd/app`).
- Verify: `make computation-build` produces a binary; `docker compose
  config` validates; local `docker build computation.server.go` succeeds.
  All three confirmed 2026-07-20.

### Step 2 — Deploy and public routing (on the box)

- [x] Apache `web.frontend.vue/iotrack.live.conf`: the `/compute/`
      ProxyPass pair (SPEC Platform Placement has the exact lines), placed
      with the other prefixes (above the `/` catch-all); reload Apache on
      the box.
- [x] `make sync`, then on the box: compose build + up for the new
      service; confirm it boots against the CO-LOCATED production DB
      (compose-internal `postgres:5432`, not the host-swap URL).
- [x] Smoke through the public origin: `curl
      https://iotrack.live/compute/health` → 200; an authed report request
      with a real browser token → 200 segments (compute-dev-check's token
      minting works only for dev — use a token from a real login here).
- Verify: health + one real report served through Apache, §37 log line on
  the box. Confirmed 2026-07-20.

### Step 3 — Swap the store seam

- [x] `activityReportStore.fetchActivityReport()`: replace the mock block
      with `axios.post(`${useAppStore().getAppUrl}/compute/reports/activity`,
      payload)`, unwrap `{ success, data }`, keep the store's public shape
      unchanged (no component may notice the swap — that was the seam's
      whole point).
- [x] §34 error codes mapped per Step 0: the backend's `message` field is
      already the human-readable text for each code, so the store surfaces
      `err.response.data.message` directly (matches the existing
      `err.response.data.message` convention elsewhere in the app, e.g.
      `OrgListView.vue`) rather than duplicating a code→text map on the
      frontend; network/no-response errors fall back to the generic
      "Failed to generate the report." string.
- [x] Apply the Step 0 timeline decision (Option B): journey requests go
      real; the timeline branch stays mock-only behind `import.meta.env.DEV`
      (its removal is a Phase 6 step). The `mockActivityReport` import goes;
      `mock/activity-report.mock.ts` itself stays.
- [ ] Loading state: confirm the page's existing loading treatment covers
      a real 1–2s request on a heavy window (moved from Step 0 — needed
      the real page); fix or flag if it doesn't. NOT YET VERIFIED — needs a
      live browser check against the deployed service, not just
      `npm run build`.
- Verify: `npm run build` (type-check is the contract test — the response
  types are already transcribed from §18/§19.3); report page renders real
  data in dev against the deployed service.

### Step 4 — Gate the UI on report.view

- [x] Router: `'reports.activity': 'report.view'` in `routePermissions`;
      drop the placeholder comment on the route.
- [x] Sidebar: `v-if="authorizationStore.can('report.view')"` on the
      Reports button (same pattern as org/user/group/device/asset items).
- [x] Close the "security debt" item in the frontend ROADMAP and the UI
      roadmap's remaining checklist entries.
- Verify: `npm run build` clean 2026-07-20. Manual role-based check (a
  role holding `report.view` sees Reports, a role stripped of it gets no
  sidebar item and a router redirect) NOT YET DONE — needs a live browser
  check, folded into Step 5 acceptance.

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

## Phase 5 — Configurable Stationary Window & Jump Plausibility Gate

Planned 2026-07-20, from live-report review: real drive days (ACA-448,
AFO-544) showed short (6–25 min) idle periods between journeys reading as
`data_gap` instead of `stationary`, because `data_gap` is decided purely by
elapsed time between two received points (§14.7), before any
moving/stationary classification runs. Design discussion landed on two
independent changes — a user-adjustable confirmation window, and a new
plausibility check that turns a physically-impossible GPS jump into a
`data_gap` on its own, decoupled from the elapsed-time rule. Crosses
service boundaries like Phase 4: engine + config + API in
`computation.server.go`, a new filter control in `web.frontend.vue`.

Not changing: how `active_static` is told apart from plain `stationary` in
the first place (ignition/PTO/engine_running/digital-input signal, §11,
`internal/report/activity.go`) — only the confirmation *timing* and the
new jump gate below are new. GPS/speed decides moving vs. stopped first
(`isMoving`, §14); only once stopped does the activity signal decide which
kind of stop it is.

Decisions locked in discussion (2026-07-20), Step 0 turns them into SPEC
text:

- **Unify the confirmation window.** `StaticConfirmationSeconds` (currently
  120s) and `JourneyEndSeconds` (currently 180s) collapse into one shared
  duration — both `stationary` and `active_static` confirm on the same
  timer. Default **180s (3 min)**, user-adjustable **180s–900s (3–15 min)**
  via a dropdown in the report filter UI, next to "To" (roughly half its
  width). Per-report, not a saved org/asset setting — a request parameter.
- **New jump plausibility gate.** Compute implied speed between two
  consecutive points (haversine distance ÷ elapsed time). Above a fixed
  backend constant — **250 km/h** (comfortably above anything a road
  vehicle in Malta can do; not user-facing, not tunable via the API) — the
  transition is a `data_gap`, independent of §14.7's elapsed-time check.
  Applies **everywhere**: mid-journey (splits the journey, same as an
  elapsed-time gap would) and right after a confirmed stop.
- **Do NOT merge a preceding confirmed stop into the gap.** A `stationary`
  or `active_static` segment took multiple points and the full
  confirmation window to earn its label — a single bad point afterward
  doesn't retroactively invalidate that evidence. The confirmed stop stays
  its own segment; the jump becomes its own `data_gap` segment right after
  it. Same treatment whether the jump follows a stop or a journey — no
  look-behind, no retroactive merge, the state machine stays forward-only.

### Step 0 — Decisions and SPEC update (docs only, before code)

- [x] **Request parameter:** `stationary_window_seconds` (optional,
      integer seconds). Validates to **180–900**;
      `REPORT_VALIDATION_ERROR` (400) outside that range. Omitted → the
      resolved profile's default (vehicle 180, personal 600). Applies to
      whichever profile the report resolves to (§4.3) — harmless/unused
      for `asset`/timeline reports, which have no stationary concept
      (§3.3).
- [x] **Engine config field:** `StaticConfirmationSeconds` and
      `JourneyEndSeconds` collapse into one field,
      **`StationaryConfirmationSeconds`**, read by both the
      `active_static` and `stationary` branches of `stepStationary`
      (§14.4–§14.6). Personal profile's default stays **600s** (already
      identical for both source fields today, so this is a no-op merge
      for personal); personal also accepts the same
      `stationary_window_seconds` override rather than a separate
      request field — one parameter, both profiles.
- [x] **Jump-gate field:** reusing the name already drafted (and never
      implemented) in the root design doc §40 —
      **`MaximumPlausibleSpeedKph`** — rather than inventing a new one.
      **Both vehicle and personal: 250 km/h**, same value, same rule —
      not the design doc's original split draft (220 vehicle / 160
      personal). Decided 2026-07-20: mode (`journey` vs `timeline`), not
      asset type, is what should actually decide whether the gate
      applies — a real ferry/flight between two sparse pings is the
      scenario that would make a fixed gate unsafe for "personal," but
      that only matters once a slow-pinging personal tracker can
      actually resolve to `timeline` mode instead of being forced through
      `journey`. That auto mode-switch doesn't exist yet — §4.3 today is
      asset-type-only (`personal` always → `journey`) — building it is
      Phase 6's job, gated on real sparse-tracker data. Until then, every
      personal-profile report IS a journey report, so it gets the same
      physical-plausibility reasoning as a vehicle. In practice today
      both production personal devices report every ~20s anyway — dense
      enough that this makes no observable difference. Revisit this
      split once Phase 6 ships the real cadence-based mode switch.
- [x] Rule written into `docs/iotrack_activity_report_design.md`: new
      **§14.8 "Implausible jump to data gap"** alongside §14.7, and a
      "confirmed stop stays separate" note added to §8.4. See Step 1 for
      the engine implementation and §36.2-style fixtures.
- Verify: decisions recorded here and in the design doc. DONE 2026-07-20.
  No code yet.

### Step 1 — Engine: unify the confirmation window

- [x] `internal/report/config.go`: `StaticConfirmationSeconds`/
      `JourneyEndSeconds` replaced by `StationaryConfirmationSeconds`;
      `VehicleConfig()` → 180, `PersonalConfig()` → 600 (unchanged, was
      already identical for both source fields). `MaximumPlausibleSpeedKph`
      also corrected to 250 for both profiles while in this file — it
      already existed as a dead/unwired field (Step 2 wires it up).
      `services.ActivityReportRequest` gains
      `StationaryWindowSeconds *int`; `report_service.go` applies it to
      the resolved profile config before `BuildSegments` when present.
- [x] `internal/report/engine.go`: `stepStationary` (§14) — both the
      `active_static` and `stationary` branches now read
      `e.cfg.StationaryConfirmationSeconds`.
- [x] `scenario_test.go` comment updated for the merged field name/value
      (behavior unchanged — 90s test fixture stays under the new 180s
      threshold same as the old 120s one). New
      `config_test.go`: `TestStationaryConfirmationSecondsUsesConfiguredWindow`
      — confirms both branches respect the configured window (present at
      the 180s default within a 400s span; absent when overridden to 600s,
      same span) and that active_static isn't reading a stale hardcoded
      value.
- Verify: `GOCACHE=/tmp/gocache go test ./internal/report` and
  `go build ./...` clean 2026-07-20; full `go test ./...` also clean.

### Step 2 — Engine: jump plausibility gate

- [x] `internal/report/movement.go`: `impliedSpeedKph(distanceMeters,
      elapsed)` helper alongside `haversineMeters`/`isMoving`.
- [x] Wired into `engine.step()` (§14.8) alongside the existing §14.7
      elapsed-time check — `gapByElapsedTime || gapByImplausibleJump`,
      same close-then-append-gap branch, neither depends on the other.
      `MaximumPlausibleSpeedKph <= 0` disables the check (kept for the
      field's original "unset = off" intent, even though both profiles
      are set today).
- [x] The "keep separate" decision needed no special-case code — closing
      an already-confirmed `stationary`/`active_static` segment on a
      following gap is just the existing `closeCurrent` behavior every
      transition already uses; confirmed by the new fixture asserting the
      closed segment's `EndAt` is untouched by the jump after it.
- [x] New `jump_gate_test.go`, `TestImplausibleJumpBecomesDataGap`: (a) a
      confirmed stop followed by a jump → 2 segments (stationary,
      data_gap), stop's `EndAt` unchanged; (b) a mid-journey jump → 3
      segments (journey, data_gap, journey), gap spans exactly the two
      points either side of the jump.
- Verify: `GOCACHE=/tmp/gocache go test ./internal/report` and full
  `go test ./...` clean 2026-07-20.

### Step 3 — API: accept the confirmation-window override

- [x] `internal/api/handlers/report_handler.go`: `activityReportBody`
      gains `stationary_window_seconds` (`*int`, omitempty); validated
      180–900 (`minStationaryWindowSeconds`/`maxStationaryWindowSeconds`
      constants), `REPORT_VALIDATION_ERROR` (400) outside it; threaded
      straight through to `services.ActivityReportRequest`. Omitted →
      nil → the resolved profile's default (Step 1's service-layer
      behavior).
- [x] `report_handler_test.go`: validation table extended (below min
      179, above max 901, non-integer JSON value). New
      `TestActivityReportStationaryWindow`: both boundaries (180, 900)
      accepted, a mid-range value and the omitted case both round-trip
      correctly to `fakeGenerator.lastReq`.
- Verify: `GOCACHE=/tmp/gocache go test ./internal/api/handlers` and full
  `go build ./...` / `go test ./...` clean 2026-07-20.

### Step 4 — Frontend: the confirmation-window dropdown

- [x] `src/types/activity-report.type.ts`: `ActivityReportRequest` gains
      `stationary_window_seconds?: number`.
- [x] `ReportFilters.vue`: new `VueSelect` next to "To" (`.vform__group--narrow`,
      `flex: 0.5` — confirmed exactly half the "To" field's width: 166px vs
      332px), 4 discrete stops across the 180-900s range (3/5/10/15 min),
      default 180s (3 min); reuses the Asset field's proven
      `teleport=".dashboard"` pattern rather than a plain `<select>` — no
      new clipping mechanism needed, unlike `ReportDateField.vue`'s v-calendar
      problem, since VueSelect already has native teleport support. Wired
      into `generate()`'s payload alongside asset/from/to.
- [x] `activityReportStore.ts`: unchanged, as expected — the field rides
      along in the existing `fetchActivityReport(payload)` call untouched.
- Verify: `npm run build` clean 2026-07-20. Browser-checked via a scratch
  harness + headless Chromium: default "3 min" confirmed, all 4 options
  render, width is exactly half, zero console errors. One false alarm
  along the way: the harness initially rendered `.dashboard` as static
  HTML outside any Vue component, so Vue's scoped `--vs-*` CSS variables
  (set on `.v-ui` in `_form.scss`, scoped per-component) never matched it —
  produced a label/value overlap that also reproduced identically on the
  *Asset* field, which the user's own earlier real-browser screenshots
  already proved renders correctly in production. Confirmed harness-only,
  not a real bug; fixed by rendering `.dashboard` from an actual mounted
  component, but the underlying visual polish still wants a real
  browser pass — folded into Step 5 acceptance alongside the other
  browser-only checks already deferred there.

### Step 5 — Bridge a silent-but-parked gap

Found 2026-07-20 during acceptance testing: Steps 0-4 didn't
actually fix the problem Phase 5 was motivated by. Real report on
AIC-497 (19 Jul 23:00 – 20 Jul 21:16 UTC): 4 journeys, 2h41m moving,
**`stationary`/`active_static` both 0m**, `data_gap` 15h26m — despite 625
of the parked points showing `Ignition=On` the whole time. Root cause
(confirmed against production telemetry via `dbquery.sh`, read-only):
this tracker deliberately drops to a heartbeat of roughly once every 6h
once parked (dense ~70s cadence on-shift, near-silence off-shift) — six
real gaps in the raw data, four in the 6–25 min band Phase 5's own
motivation named, two exactly 6h. Every one exceeds
`MaximumPointGapSeconds` (300s), and `engine.go`'s `step()` runs the
§14.7/§14.8 gap checks **before** `stepStationary` on every point pair,
with no "already confirmed" exception — so the `StationaryConfirmationSeconds`
clock (Steps 0-1) never gets a chance to start, regardless of what it's
set to. Steps 0-4 changed *how long* confirmation takes and added a
*second* gap trigger, but never touched this ordering — the actual bug
predates Phase 5 and survived it.

Decided 2026-07-20 (mirrors the reasoning already used for §14.8): a gap
tripped by elapsed time alone (§14.7) shouldn't automatically mean
"unknown" if the position barely changed and the activity signal doesn't
conflict across it — that's a tracker choosing to report less often while
parked, not a real absence of information.

- [x] Design doc: new §14.9 "Bridge a silent-but-parked gap"
      (`docs/iotrack_activity_report_design.md`) — a silence tripped by
      §14.7 alone (§14.8's jump gate still fires first, independently and
      unconditionally) is bridged instead of gapped when `!isMoving` on
      the far point AND `ResolveActivity` doesn't conflict across the gap
      (both true → `active_static`-eligible; both false/nil/mixed
      false-nil → `stationary`-eligible; true vs false → never bridged,
      a real gap). Also documents the §8.4 "confirmed stop stays
      separate" invariant's counterpart here.
- [x] `internal/report/engine.go`: `bridgesSilentGap` + `closeGapAndReset`
      helpers; ordered after the §14.8 jump gate (unaffected) and gated
      on `!moving`, not a bare distance check — `moving` already covers
      `MinimumMovementMeters` via `isMoving`, so no separate/redundant
      distance comparison needed in the bridge helper itself. The
      `!moving` gate turned out to be load-bearing, not just tidy: an
      earlier version checked only the pair's own distance and broke
      `TestScenarioEGapNotBridged` — two journeys can share an endpoint
      by coincidence, and that point's reported *speed* still marks it
      moving even though its *distance* from the previous point is ~0.
- [x] New `bridge_test.go`, `TestBridgeSilentButParkedGap`: (a)
      AIC-497-shaped — two points hours apart, same position, ignition
      on both sides → one `active_static` segment spanning the gap, zero
      `data_gap`; (b) same but ignition disagrees (on then off) → stays
      a genuine `data_gap`, not bridged. (c) the position-differs/moving
      case is already covered by `TestScenarioEGapNotBridged` (kept as
      the canonical test for that invariant rather than duplicated) —
      noted in a comment rather than re-run.
- Verify: `GOCACHE=/tmp/gocache go test ./internal/report` and full
  `go test ./...` clean 2026-07-20. **Re-run against real production
  data** (`compute-dev-check/scripts/devserver.sh` + `mktoken.py`,
  read-only): AIC-497, same window as the bug report —
  `stationarySeconds` went from **0** to **43,228s (~12h)**;
  `communicationGapSeconds` dropped from 55,554s (15h26m) to **12,354s
  (~3h26m)** — the remainder is presumably genuine cases where
  position/activity didn't agree across the silence, which is correct,
  not a residual bug. `activeStaticSeconds` stayed 0 — the specific
  points bounding each bridged gap didn't both resolve ignition=true,
  even though ignition was on for most parked points overall; resolves
  to the (correct, no-invented-active_static) `stationary` branch
  instead.

### Step 6 — Movement flag must not override known speed

Found 2026-07-20, same acceptance pass as Step 5, on AFO-544: after Step
5 landed, a real report still showed a phantom two-point, three-second,
seven-metre "journey" sitting inside a genuinely parked, ignition-on
period, and the day was fragmented into many tiny fake journeys (9m, 6m,
10m…) instead of a handful of real trips with proper `active_static`/
`stationary` gaps between them. Root cause (confirmed against production
telemetry via `dbquery.sh`, read-only, using the correct `telemetry->
'elements'->'240'` path — an earlier query against the wrong key had
masked this): `MovementDetected` (§12) on this device just mirrors
ignition state — true for the *entire* time ignition is on, including
10+ minutes standing still at speed=0 — not real relocation.
`internal/report/movement.go`'s `isMoving` treated all three signals
(speed, distance, flag) as peers, so the flag alone kept confirming
"movement" throughout ordinary idling, everywhere in the engine, not
just at gap boundaries. Step 5's bridge logic was innocent — this bug
predates Phase 5 and would have produced the same fragmentation with or
without it; Step 5's testing against AIC-497 happened not to surface it
because that asset's activity signal came from ignition directly, not
this flag.

Decided 2026-07-20: `MovementDetected` becomes a fallback, not a peer —
only consulted when there's no GPS-derived speed reading at all. It
still serves its original purpose (a GPS blackout with real
accelerometer-detected movement), just never overrides a speed reading
that's actually present and known.

- [x] Design doc §12 revised with the finding and the corrected rule
      (`docs/iotrack_activity_report_design.md`).
- [x] `internal/report/movement.go`: `isMoving` only falls through to
      `MovementDetected` when `point.SpeedKph == nil`; a present speed
      (even a known zero) settles the question via speed/distance alone.
- [x] `movement_test.go`: updated the pre-existing "movement flag alone"
      case (which had encoded the disproven assumption) to assert the
      flag can't override a present zero speed, and added the fallback
      case (flag alone, speed genuinely unknown, still counts). New
      `movement_flag_test.go`,
      `TestMovementFlagDoesNotOverrideKnownZeroSpeed`: the exact
      AFO-544 shape (20 points, same position, ignition on,
      MovementDetected=true throughout, speed=0) reads as one
      `active_static` segment, not a chain of phantom journeys.
- Verify: `GOCACHE=/tmp/gocache go test ./internal/report` and full
  `go test ./...` clean 2026-07-20. **Re-verified against real
  production data**: AFO-544's phantom journey is gone;
  `activeStaticSeconds` went from 0 to 2007s across the day, with
  several genuine `active_static`/`stationary` segments now appearing
  where fragmented fake journeys used to be; `totalDistanceMeters`
  dropped from 28,823m to 22,503m (removing ~6.3km of phantom distance
  attributed to fake journeys that were really idling).
  AIC-497 re-checked too, no regression: `activeStaticSeconds` improved
  further, from 0 (pre-Step-5) to 7,101s (this fix on top of Step 5's
  bridge) — some of Step 5's bridged gaps had been resolving to
  `stationary` only because this same flag bug was interfering with
  activity resolution nearby.

### Step 7 — Jump-gate distance floor & position-only bridge rule

Found 2026-07-20, third round of the same acceptance pass (YSM-815's
real report: zero-duration Data Gap rows mid-journey, and back-to-back
Data Gap rows shredding an unmoved 47-minute parked period). Two
distinct root causes, both confirmed against production telemetry via
`dbquery.sh` (read-only):

- **§14.8 fired on GPS reacquisition snap.** Pulling away from a 30s
  traffic stop, position snapped ~330m in 3s — implied ~400 km/h,
  tripping the speed gate and splitting a real journey with a
  0-duration `data_gap`. Implied speed over tiny elapsed times
  amplifies ordinary positional noise. Fix: new `MinimumJumpMeters`
  floor (500m, both profiles) — the gate only fires when displacement
  is km-scale; it's a teleport detector, not a jitter detector.
- **The §14.9 activity-conflict rule blocked bridging on flickery wake
  bursts.** The parked tracker wakes every ~15-25 min in a short burst
  whose ignition reading flickers 1→0 within seconds (§14.6's debounce
  warning made real), so every silence boundary "conflicted" (prev side
  ends ign=0, next side starts ign=1) and the bridge refused every
  time — despite coordinates identical to the meter for 47 minutes.
  Fix — **deliberately reverses the earlier "conflict → never bridge"
  decision** (recorded in Step 5, agreed in design discussion) on new
  evidence: position alone decides the bridge. `data_gap` means route
  unknown (§8.4); with identical coordinates there is no unknown route.
  The far point's activity classifies the bridged span, so a conflicted
  silence ending activity-off gets the weaker claim (`stationary`).
  Known tradeoff, recorded in §14.9 and the threshold-tuning backlog:
  a silence *ending* activity-on stamps the span `active_static`,
  possibly over-claiming "working" time — revisit with device ground
  truth.

- [x] `config.go`: `MinimumJumpMeters` (500, both profiles); design doc
      §14.8 transition formula + §40 updated.
- [x] `engine.go`: §14.8 requires `distance >= MinimumJumpMeters`; §14.9
      bridge condition reduced to `!isMoving` (`bridgesSilentGap`
      deleted); design doc §14.9 rewritten with the evidence and the
      attribution tradeoff.
- [x] Tests: `jump_gate_test.go` gains the YSM-815-shaped sub-floor
      snap regression (330m/3s mid-journey → one continuous journey, no
      split); `bridge_test.go`'s conflict fixture now pins the NEW rule
      (conflicted same-position silence bridges as plain `stationary`,
      never an invented `active_static`); scenario E (moving far point
      never bridges) unchanged and still green.
- Verify: full `go build ./...` / `go test ./...` clean 2026-07-20.
  **Re-verified against real production data, all four assets:**
  YSM-815 data_gap 5h9m → 0m (zero-duration and back-to-back gap rows
  gone entirely); ACA-448 15h52m → 30m; AFO-544 8h43m → 5m; AIC-497
  3h26m → 18m. Remaining gaps are genuine moved-during-silence cases
  (route truly unknown). No phantom journeys; totals reconcile.

### Step 8 — Conflicted-silence attribution & the stale pinned point

Found 2026-07-21, fourth round of the same acceptance pass (ACA-448's
real report). Two unrelated findings:

- **The Step 7 attribution tradeoff bit immediately.** The report showed
  18h11m of Active Stationary in a ~40h window, including a 1h56m
  "Working — IGNITION" block. Raw telemetry (via `dbquery.sh`,
  read-only): driver parks 13:30 with engine idling (dense ignition-on
  cadence — genuinely active_static), switches the engine OFF at
  13:33:35 — **recorded** — tracker sleeps 1h52m, wake burst's first fix
  reads ignition=1 and stamps the whole silence "Working". Fix: a
  one-shot `bridgedConflict` flag — when a bridged silence's two
  bounding points genuinely conflict (both non-nil, differing), the
  confirmation that closes it is demoted to plain `stationary`; the
  wake point's own activity counts only from the points that follow it.
  Silences whose sides AGREE on activity-true still confirm
  `active_static` (two ignition-on observations bounding an unmoved
  silence is real evidence; one flickery wake fix is not).
- **The "coordinate jump" was not engine data at all.** The slider
  tooltip showed 36.07333, 14.22887 (Gozo) on an asset whose entire
  history contains zero points above latitude 36.0 (confirmed by DB
  scan). Root cause in `activityReportStore.fetchActivityReport()`:
  `selectedSegmentId` was reset on a new report but `selectedPoint` was
  not — a pinned point from the PREVIOUS report (an asset on Gozo)
  survived regeneration and rendered on the new report's map as a
  phantom teleport. Fix: reset both.

- [x] `engine.go`: `bridgedConflict` one-shot flag, set in `step()` on a
      conflicted bridge, consumed in `stepStationary` (demotes `active`
      to false for that confirmation only); design doc §14.9 updated
      with the resolved attribution rule (replaces the "known
      tradeoff" paragraph).
- [x] `bridge_test.go`: new ACA-448-shaped fixture — dense ignition-on
      idle, recorded switch-off, 2h silence, ignition-on wake fix →
      (journey, active_static, stationary); the active_static never
      extends past the recorded switch-off (boundary within the §15
      backdating granularity), the silence confirms `stationary`.
- [x] `activityReportStore.ts`: `selectedPoint` reset alongside
      `selectedSegmentId` on report generation; `npm run build` clean.
- Verify: full `go test ./...` clean 2026-07-21. **Re-verified against
  production, ACA-448's exact screenshot window**: the 1h56m Working
  block now reads `active_static 13:30→13:33 (3m)` +
  `stationary 13:33→15:26 (1h52m)`, boundary on the recorded
  switch-off to the second; Active Stationary total 18h11m → **1h44m**
  (difference moved to Stationary; journeys/moving/gap unchanged).
  Regression sweep, other three assets: YSM-815 active_static
  5h7m → 19m, AFO-544 5h3m → 32m, AIC-497 3h39m → 1h57m (its remaining
  active_static comes from silences whose BOTH sides read ignition-on —
  kept by design); data gaps and journey counts unchanged everywhere,
  zero zero-duration gaps.

### Step 9 — Route holes, unconditional silence demotion, and point row ids

Found 2026-07-21, fifth round of the same acceptance pass (AFO-544,
AIC-497, PXH-605 real reports):

- **§14.10 — a short silence hiding too much road.** AFO-544 reappeared
  1156m away after 235s of silence (and again: 1108m/137s) — under
  §14.7's elapsed threshold, implied speed ~18 km/h so §14.8 stayed
  quiet — and the report drew a straight fabricated "route" across
  terrain the tracker never reported (user-spotted near Marsalforn).
  New third gap trigger: `elapsed >= MinimumRouteHoleSeconds` (90s,
  both profiles) AND `distance >= MinimumJumpMeters` (500m, shared
  with §14.8) → `data_gap`. Dense ~10s cadence can never trip it.
- **§14.9 demotion is now unconditional.** The conflicted-only rule
  (Step 8) still let AGREEING endpoints over-claim: AIC-497 heartbeats
  hours apart both reading ignition-on stamped multi-hour silences as
  "Working". Two isolated samples prove the vehicle stayed put — not
  that the engine ran throughout. Every bridged silence now confirms
  as plain `stationary`; dense observed data is the only path to
  `active_static`, which is what the label claims to be.
- **Remaining Active Stationary is real observed data, not a bug.**
  After the demotion, PXH-605 still shows ~4h and AIC-497 ~2h — their
  biggest blocks are 30m+ at 10s/point cadence, ignition ON, parked
  (194 observed points in one block). The engine faithfully reports
  the device's ignition wire; whether that wire means "engine running"
  is a per-device wiring/configuration question. To let the owner
  audit exactly this, the expanded point rows now show the
  **`app.telemetry` row id** (already flowing end-to-end via
  `TelemetryPoint.ID` — display-only change in `ReportTable.vue`).

- [x] `config.go`: `MinimumRouteHoleSeconds` (90, both profiles);
      design doc §14.10 + §40 updated.
- [x] `engine.go`: `gapByRouteHole` alongside the §14.8 gate;
      `bridgedConflict` → `bridgedSilence`, set on every bridge (the
      activity-comparison gone); §14.9 doc text updated.
- [x] Tests: new §14.10 fixture (235s/1.1km hole mid-journey → journey,
      data_gap, journey); the both-true bridge fixture now pins
      `stationary` (never invented working time); ACA-448 wake fixture
      unchanged and green.
- [x] `ReportTable.vue`: ID column in the expanded §27 point rows.
- Verify: full `go test ./...` + `npm run build` clean 2026-07-21.
  **Production, all five assets**: AFO-544's two Marsalforn holes now
  render as `data_gap` rows (3m55s, 2m17s); AIC-497 active_static
  2h4m → 1h59m and PXH-605 4h4m → 4h3m (their remainder is dense
  observed ignition-on data — 10s cadence, confirmed raw); YSM-815 /
  ACA-448 unchanged except the demotion. Journey counts rose slightly
  where fabricated route lines used to stitch across holes (AFO-544
  22 → 25) — those are now honest splits.

### Step 10 — Phase 5 acceptance

- [ ] Re-run a report against a real drive day that previously showed
      short data_gap bands between journeys (e.g. ACA-448/AFO-544) with
      the default 3 min window; confirm short idle periods that are
      genuinely stationary (no implausible jump) now read as `stationary`
      not `data_gap`, and that ordinary idling no longer fragments into
      phantom journeys (Step 6).
- [ ] Re-run AIC-497's 19-20 Jul window specifically — Step 5's bridge
      fix — confirm `stationary`/`active_static` are no longer 0m and
      the ~6h off-shift periods now read as one continuous segment.
- [ ] Confirm a real or fixture-simulated GPS jump still reads as
      `data_gap`, and that it does NOT merge into a preceding confirmed
      stop segment.
- [ ] Adjust the dropdown to 15 min in the browser and confirm the report
      changes accordingly.
- [ ] Docs updated: this file's Current State, SPEC.md status.
- Verify: acceptance walk recorded here, boxes ticked.

## Phase 6 — Timeline Mode (§4.2, scenario F) — planned, data first

Promoted from Later on 2026-07-19 (was deferred for lack of ground truth:
every production asset is a dense vehicle tracker). Chris is generating
real sparse data with a spare device. Do not start the detailed step
roadmap until that data exists — survey first, as with every phase.

Data prerequisites (collecting now, ~5–7 days):

- [ ] The device assigned to an asset (telemetry must carry `asset_id`,
      §45) with a non-vehicle `asset_type` (`personal` or `asset`) — that
      type is likely half of the §4.3 "auto" mode-selection answer.
- [ ] Genuinely sparse cadence: a handful of fixes per day (deep sleep +
      periodic wake, or manual power-ons a few times a day) — NOT the
      vehicle stream.
- [ ] Variety: repeated pings from one spot (observation clustering),
      several genuine location changes, and some indoor fixes (real
      `gpsValid=false` cases).

Rough shape when the data is in (a Phase-2-sized job, not a Phase 3):
survey the collected data → pin `TimelineObservation` + the §4.3 auto
rule in SPEC (no durations/speeds/routes — §3.3/§48) → the observation
clusterer in `internal/report` with fixture tests → mode switch in the
service → **remove the Step 0 Option-B dev flag from the frontend store**
→ acceptance against the device's real days.

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

- [ ] An ignition-on stop ≥ `StationaryConfirmationSeconds` (180s as of
      Phase 5, was 120s) becomes **active_static** via the §11 ignition
      fallback — a long red light or traffic queue reads as "working".
      Options when real data decides: a longer confirmation for
      ignition-sourced activity, or requiring a stronger §11 source
      (pto/engine_running/work input) for active_static.
- [x] ~~A §14.9-bridged silence is classified by the FAR point's
      activity~~ — RESOLVED 2026-07-21 (Phase 5 Step 8): a conflicted
      silence now demotes to plain `stationary`; only silences whose two
      sides agree on activity-true confirm `active_static`.
- [ ] A single GPS spike ≥ `MinimumMovementMeters` (25m) yields TWO
      "moving" points (out and back), which meets
      `MovementConfirmationPoints` (2) and confirms a phantom journey.
      The 10m-jitter case is covered (scenario D test); a lone larger
      spike is not. Options: confirm on points AND meters, or a minimum
      journey distance.

Tracked in `SPEC.md` (Implementation Roadmap): the §43
look-behind/look-ahead fetch widening, reverse geocoding (§28), groups
(§19.2 — intersection, never union), export, alarms, audit events (§35).
(Phase 4 wiring and timeline mode have their own sections above.)

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
