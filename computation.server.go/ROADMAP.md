# Computation Server Roadmap

This file tracks the implementation work for `computation.server.go`.
`SPEC.md` remains the source of truth for the service role, contracts, and
expected runtime behavior; steps below reference it rather than repeat it.

## Current State

- **Phases 1 and 2 are complete.** The endpoint serves NORMALISED points:
  §10 TelemetryPoint with camelCase §18 contract keys, pointers marshalling
  to null (never false), ibutton/rfid strings end to end, invalid
  coordinates marked gpsValid=false but kept, unknown IO ids passing
  through under numeric keys, and the §37 log carrying
  raw/accepted/invalid-GPS counters. Acceptance spot-checked live against
  raw DB rows (0/1 numbers became booleans, timestamp equals happened_at,
  7 invalid fixes identified in a real range and still served).
- **Phase 1** delivered `POST /compute/reports/activity` behind the full
  auth/access chain: JWT →
  `report.view` permission → org match → per-user asset override → range
  limit → telemetry fetch, with §34 error shapes, a REPORT_MAX_CONCURRENT
  semaphore, and one §37 log line per request.
- Layering as specced: thin handlers → services → repositories (upper/db
  for the asset lookup, raw pgx elsewhere) → structs-only models.
- Tests: httptest tables for middlewares and handler; RUN_DB_TESTS=1
  integration suites for repositories and the report service; the Step 10
  acceptance matrix passed against the dev database.
- Next: Phase 3 (the pure segmentation engine) — detail its steps below
  when it starts, promoting the frontend fixture
  (web.frontend.vue/src/mock/activity-report.mock.ts) into Go test
  fixtures for the §36.2 scenarios.

## Phase 1 — API Skeleton and Access (§38 Phase 1)

Deliverable: `POST /compute/reports/activity` returning
`{ subject, rawPointCount, points: [] }` with the full auth/access chain
enforced. No segmentation. Each step leaves the service compiling and
runnable; remove a directory's `.gitkeep` when its first real file lands.

### Step 0 — Housekeeping

- [x] Fix the `internal/db/db.go` copy-paste bug: the `DB_MAX_CONN_IDLE_TIME`
      branch assigns `poolConfig.MinConns` instead of `MaxConnIdleTime`.
      (Also fixed the swallowed pool-creation error while there.)
- [x] `go get github.com/golang-jwt/jwt/v5`, then `go mod tidy` once imports
      exist (current deps are all marked indirect).
- Verify: `GOCACHE=/tmp/gocache go build ./...` still passes.

### Step 1 — HTTP skeleton

- [x] `internal/httpserver/httpserver.go` — `NewHttpServer(app, port,
      closedCh)` + graceful shutdown, modelled on
      `file.server.go/internal/httpserver`.
- [x] `internal/api/routers/router.go` — chi root router (Recoverer,
      RequestID, CORS as in the file server), everything mounted under
      `/compute`.
- [x] `GET /compute/health` — returns 200 and the service name; lives in
      `internal/api/handlers/health_handler.go`.
- [x] Rewrite `cmd/app/main.go` to the SPEC boot sequence (logger → env →
      appcore → DB → signal ctx → HTTP → graceful shutdown). The prototype
      one-shot query goes away here.
- Verify: `go run ./cmd/app`, `curl localhost:4004/compute/health`, Ctrl+C
  logs a clean shutdown.

### Step 2 — JWT middleware

- [x] `internal/api/middlewares/jwt_auth_middleware.go` — port from
      `file.server.go`, extended: validate HS256 Bearer via `JWT_SECRET`,
      put `userID`, `roleID`, `orgID` into the request context (typed
      context keys, not bare strings).
- [x] Wire it onto the `/compute/reports` sub-router only — `/compute/health`
      stays open.
- [x] `jwt_auth_middleware_test.go` — httptest table: no token, malformed
      header, bad signature, expired token → 401; valid token → next handler
      sees userID/roleID/orgID in context.
- Verify: tests pass, plus a real token from a Node login → stub 200.

### Step 3 — Seed `report.view`

- [x] Add `report.view` to `app.permissions` in
      `initdb-scripts/05-tables.sql` with deliberate `role_permissions`
      defaults (§20). This is the same seed the frontend sidebar gating
      needs — one seed serves both (frontend ROADMAP "security debt" item).
- [x] Apply the same INSERTs manually to the running dev database —
      initdb scripts only run on a fresh volume.
- Verify: `SELECT * FROM app.role_permissions_view WHERE key='report.view';`
  shows the intended roles.

### Step 4 — Permission middleware

- [x] `internal/api/middlewares/permission_middleware.go` — mirrors
      `web.backend.node.ts` `requirePermissions`: `role_id == 1` bypasses;
      otherwise the role must hold the key per `app.role_permissions_view`.
- [x] Wire onto `/compute/reports` after the JWT middleware.
- [x] `permission_middleware_test.go` — httptest table: role without the key
      → 403; role with the key → passes; role_id 1 → passes without lookup.
- Verify: tests pass, plus the same checks with real tokens.

### Step 5 — Models and repositories

- [x] `internal/models` — structs only: `Telemetry` (keep the struct, drop
      `GetByID`), `Asset` (id, uuid, organisation_id, asset_type, name).
      Delete the global session plumbing in `models.go`.
- [x] Read `AccessProfileController` in `web.backend.node.ts` **first** and
      write down the user→asset access semantics as comments — mirror, don't
      invent (SPEC auth chain).
- [x] `internal/repository/repository.go` — `Repository` aggregate +
      `NewRepository(pool)`; hang it on `appcore.App`.
- [x] `asset_repository.go` — `GetByUUID(ctx, uuid)`.
- [x] `access_repository.go` — `UserHasAssetAccess(ctx, userID, assetID)`
      per the Node semantics; groups never grant (§20).
- [x] `telemetry_repository.go` — `RangeByAsset(ctx, assetID, from, to)`
      ordered by `happened_at ASC` (§29, §45: by asset_id, never device_id),
      raw pgx.
- [x] Repository integration tests gated behind `RUN_DB_TESTS=1` (the
      parser's `RUN_REDIS_TESTS` pattern): known asset returns sorted rows,
      unknown asset returns none. Skipped without the flag so
      `go test ./...` stays green anywhere.
- Verify: `RUN_DB_TESTS=1 GOCACHE=/tmp/gocache go test ./internal/repository`
  against the dev DB.

### Step 6 — Config and appcore

- [x] `appcore.App` gains `Config`: range limits per tracker category
      (`REPORT_MAX_RANGE_DAYS_*`), `REPORT_MAX_CONCURRENT` (SPEC
      Configuration table), parsed once at boot.
- Verify: boot logs the effective config; bad values fall back to defaults.

### Step 7 — Report service

- [x] `internal/services/app_service.go` — `Service` wrapping `App`
      (parser pattern).
- [x] `internal/services/report_service.go` — the Phase 1 sequence:
      asset lookup → org check (JWT `org_id`, §20) → access check →
      range-limit check by `asset_type` → telemetry fetch → build
      `{ subject, rawPointCount, points: [] }`.
- [x] Typed service errors the handler can map to §34 codes
      (`ASSET_NOT_FOUND`, `ASSET_ACCESS_DENIED`, `REPORT_VALIDATION_ERROR`).
- Verify: unit-callable without HTTP; wrong org / no access return the
  typed errors, never telemetry.

### Step 8 — Handler and route

- [x] `internal/api/handlers/report_handler.go` — decode
      `{ asset_uuid, from, to }`, validate (required fields, ISO timestamps
      → UTC, `from < to`), call the service, wrap in the `{ data: ... }`
      envelope; §34 error shapes with the right HTTP statuses (400/404/403).
- [x] Bound concurrency with the `REPORT_MAX_CONCURRENT` semaphore —
      waiters queue, they don't fail.
- [x] `internal/api/routers/report_router.go` — `POST /compute/reports/activity`
      behind JWT + permission middlewares.
- [x] `report_handler_test.go` — validation table: missing fields, bad
      dates, `from >= to`, over-limit range → 400 with the right §34 code in
      the body. Pins the error contract the frontend depends on.
- Verify: tests pass, then the curl matrix below.

### Step 9 — Request logging

- [x] Log per report request (§37 subset for Phase 1): user ID, org ID,
      asset ID, range, raw point count, duration, outcome. Never full
      payloads.
- Verify: one clean log line per request in dev mode.

### Step 10 — Acceptance (§38 Phase 1 criteria)

All via curl against the dev stack (token from a Node login):

- [x] No/invalid token → 401.
- [x] Valid token, role without `report.view` → 403.
- [x] Asset UUID that doesn't exist → 404 `ASSET_NOT_FOUND`.
- [x] Asset from another organisation → 403 `ASSET_ACCESS_DENIED`.
- [x] `from >= to`, bad dates, missing fields → 400 `REPORT_VALIDATION_ERROR`.
- [x] Range over the category limit → 400.
- [x] Valid request → 200, `rawPointCount` matches a manual
      `SELECT count(*)`, points sorted ascending (spot-check).
- [x] Range with no telemetry → 200 success with zero count (§34 — not an
      error).
- [x] `GOCACHE=/tmp/gocache go test ./...` and `go build ./...` clean.

## Phase 2 — Normalisation (§38 Phase 2, §10–§11)

Deliverable: the report pipeline hands the engine (and, for now, the
response) `[]report.TelemetryPoint` — the §10 internal shape — instead of raw
DB rows. Acceptance (§38): nothing downstream of the normaliser depends on
raw DB column names; invalid points are identified (marked, not dropped —
dropping is the engine's §13 decision); null values stay distinct from false.

### Ground truth — dev DB survey (2026-07-16, 3000 recent rows)

Facts the steps below are built on; re-verify with `compute-dev-check`'s
`dbquery.sh` if the parser changes:

- Payload keys: `latitude`, `longitude`, `altitude`, `angle`, `speed`,
  `satellites`, `priority`, `timestamp` (epoch **string**), `elements`.
- Only vendor today: `teltonika` (protocol `4G`, model NULL). The vendor
  mapper is a seam, not a dispatch problem yet.
- Elements present in every row: `1` (digital_input_1), `239` (ignition),
  `240` (movement), `16` (total_odometer), `66`/`67` (voltages), `21`
  (gsm_signal), `200` (sleep_mode), `80` (data_mode), `69`, `68`, `12`;
  most rows also `78` (ibutton), `181`/`182` (pdop/hdop), `241`, `248`.
- Encodings that must not be guessed wrong:
  - `239`/`240` are JSON **numbers 0/1**, never booleans;
  - `78` is number `0` when no tag is present, and a quoted **string** when
    a real 18-digit tag is (the parser's NormalizeIDs guarantees this);
  - the payload `timestamp` is an epoch string — but `happened_at` is the
    authoritative, already-parsed UTC time; the payload copy is ignored.
- `pto` / `engine_running` (§11's first two priorities) do not exist in
  current data — activity resolution will fall through to ignition today.
  Keep the branches anyway; they are the contract with future tracker
  configs.
- A second survey across the table's full span (Sep 2025 → Jul 2026,
  924k rows) added:
  - the **oldest** 3000 rows are not uniform: `239` (ignition) is present
    in only ~78% and `1`/`78` in ~60% — the nil paths (`IgnitionOn == nil`)
    are real data, not defensive theory;
  - ids absent from recent rows appear historically (`11`, `14`, `206`) —
    the unknown-id passthrough is exercised by real rows;
  - 64% of all telemetry has `NULL asset_id` (unassigned devices) and can
    never reach a report (§29) — report-scale numbers are the asset-scoped
    ~328k rows, all `vehicle` type; no personal-tracker payloads exist yet.

### Step 0 — Shape decisions (docs only, before code)

- [x] Pin the `TelemetryPoint` struct in `SPEC.md` (§10 fields, Go types):
      pointers for every §41.4 null-able signal (`IgnitionOn`, `ActivityOn`,
      `MovementDetected` as `*bool`), `GPSValid bool`, `Parameters
      map[string]any` keyed by parser names. JSON tags camelCase to match
      the §18 `ReportPoint` contract (`speedKph`, `ignitionOn`, …) so the
      frontend's point shape is satisfied by the same struct; the extra
      fields (`movementDetected`, `gpsValid`) are additive and harmless.
- [x] Decide and record the invalid-coordinate rule: latitude/longitude
      outside ±90/±180, or the 0,0 fix, marks `GPSValid=false`. Points are
      kept — §38 says identified, §13's filtering belongs to the engine.
- [x] Record the response change: Phase 1 returned raw rows; Phase 2 returns
      normalised points. `rawPointCount` keeps meaning rows fetched.
- Verify: SPEC section reads coherently against §10/§18; no code yet.

### Step 1 — report package bootstrap

- [x] `internal/report/report.go` — package doc stating the purity rule (no
      HTTP, no SQL, no logger — models in, points out) plus the
      `TelemetryPoint` and `ActivitySource` types from Step 0.
- [x] The package imports `internal/models` only (structs) — nothing else
      internal. Purity is what lets §36.2 fixtures test it directly.
- Verify: builds; `go vet` clean; no forbidden imports (spot-check).

### Step 2 — IO element naming

- [x] `internal/report/ioelements.go` — the id→name subset this service
      reads, copied verbatim from
      `teltonika.parser.go/internal/teltonika/IoElementsMap.go` naming
      (1 digital_input_1, 21 gsm_signal, 16 total_odometer, 66
      external_voltage, 67 battery_voltage, 69 gnss_status, 78 ibutton,
      80 data_mode, 181 gnss_pdop, 182 gnss_hdop, 200 sleep_mode, 207 rfid,
      239 ignition, 240 movement, 241 active_gsm_operator). Two services
      disagreeing on a name is a §-level contract bug.
- [x] Unknown ids pass through under their numeric key — never dropped,
      never renamed by guesswork.
- Verify: unit test — known id maps, unknown id survives.

### Step 3 — the normaliser

- [x] `internal/report/normalise.go` — `Normalize([]models.Telemetry)
      ([]TelemetryPoint, NormalizeStats)`:
      - `Timestamp` from `happened_at` (already UTC); payload epoch ignored;
      - `latitude`/`longitude`/`altitude`/`speed` → floats; `angle` →
        `Heading` (course source is the engine's business later — §41
        prefers course-over-ground computed from fixes, not this field);
      - `239`/`240` numbers → `*bool` (`0`→false, `1`→true, absent→nil —
        null is never collapsed to false);
      - `ActivityOn` from `digital_input_1` as a provisional work-input
        signal (absent→nil), documented as the per-asset-config seam;
      - ibutton/rfid: number `0` or empty → absent; anything else kept as a
        **string** end to end (the 2^53 rule — a real tag serialised as a
        JSON number corrupts in every browser);
      - `Parameters` carries the named elements; values otherwise unaltered;
      - invalid coordinates → `GPSValid=false`, point kept.
- [x] `NormalizeStats{Raw, Accepted, InvalidGPS int}` — the §37 counters;
      "accepted" = raw for now (nothing is dropped), the split exists so the
      engine's later filtering has somewhere to report.
- [x] `internal/report/activity.go` — `ResolveActivity(TelemetryPoint)
      (active *bool, source ActivitySource)` in §11's priority order
      (pto → engine_running → ignition → device activity → unknown).
      Per-point and pure, so it lands here rather than Phase 3.
- Verify: builds; the Step 4 tests are the real check.

### Step 4 — unit tests on real payloads

- [x] Fixtures from reality, not invention: 2–3 payloads sampled from the
      dev DB via `dbquery.sh` plus the known awkward one (the 18-digit
      ibutton string sample) as Go table-test cases.
- [x] The table pins every acceptance rule: absent `239` → `IgnitionOn ==
      nil` (not false); `0`/`1` → false/true; ibutton number-0 → absent;
      ibutton string → still a string after marshal (quoted in JSON);
      invalid/0,0 coords → `GPSValid=false` but point present; unknown
      element id preserved under numeric key; `Timestamp` equals
      `happened_at`, not the payload epoch.
- [x] `ResolveActivity` table: each §11 priority level, including the
      all-nil → `unknown` fallthrough.
- Verify: `go test ./internal/report` — no DB, no flags, runs anywhere.

### Step 5 — wire into the service

- [x] `report_service.go`: after the fetch, `report.Normalize(rows)`;
      `ActivityReportResult.Points` becomes `[]report.TelemetryPoint`;
      `RawPointCount` unchanged in meaning.
- [x] Handler log line gains `accepted_point_count` and `invalid_gps_count`
      (§37 raw/accepted/rejected).
- [x] Service integration test (RUN_DB_TESTS=1) asserts the normalised
      shape on real data: points carry camelCase JSON, `ignitionOn` is
      true/false/null (never 0/1), any ibutton in `parameters` is a JSON
      string.
- Verify: full suite; `RUN_DB_TESTS=1` suites against the dev DB.

### Step 6 — Phase 2 acceptance

- [x] devserver smoke: a served response shows normalised camelCase points;
      spot-check one row against its raw payload in the DB (same fix, 0/1
      became booleans, ibutton quoted).
- [x] §38 criteria walked: no raw column names downstream of the
      normaliser; invalid points identified; null distinct from false.
- [x] `go build ./...`, `go vet ./...`, full test suite clean.
- Verify: matrix recorded here, boxes ticked, Current State updated.

## Later Phases

Tracked in `SPEC.md` (Implementation Roadmap): Phase 3 pure segmentation
engine + the promoted frontend fixture (§36.2 scenarios), Phase 4 wiring the
frontend (swap the store seam, Apache `/compute/` prefix, root Makefile
`computation-build` target, `report.view` gating in the sidebar).

## Completed

(nothing yet)
