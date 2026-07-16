# Computation Server Roadmap

This file tracks the implementation work for `computation.server.go`.
`SPEC.md` remains the source of truth for the service role, contracts, and
expected runtime behavior; steps below reference it rather than repeat it.

## Current State

- **Phase 1 is complete.** `POST /compute/reports/activity` serves the
  §38 Phase 1 deliverable behind the full auth/access chain: JWT →
  `report.view` permission → org match → per-user asset override → range
  limit → telemetry fetch, with §34 error shapes, a REPORT_MAX_CONCURRENT
  semaphore, and one §37 log line per request.
- Layering as specced: thin handlers → services → repositories (upper/db
  for the asset lookup, raw pgx elsewhere) → structs-only models.
- Tests: httptest tables for middlewares and handler; RUN_DB_TESTS=1
  integration suites for repositories and the report service; the Step 10
  acceptance matrix passed against the dev database.
- Next: Phase 2 (normalisation) — detail its steps here when it starts,
  with the running service and real payloads at hand.

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

## Later Phases

Tracked in `SPEC.md` (Implementation Roadmap): Phase 2 normalisation,
Phase 3 pure engine + promoted frontend fixture, Phase 4 wiring the
frontend (swap the store seam, Apache `/compute/` prefix, root Makefile
`computation-build` target).

## Completed

(nothing yet)
