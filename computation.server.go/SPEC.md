# Computation Server Spec

`computation.server.go` is the platform's compute plane: the service that does
the heavy lifting over telemetry stored in TimescaleDB — reports first, alarms
and audit later — so that neither the frontend nor the Node control plane ever
computes anything substantial. The frontend only formats what this service
returns (design doc §22); `web.backend.node.ts` keeps auth issuing and CRUD.

This is a living spec for a service that is still being shaped. Update it as
decisions change; it is the authoritative reference for what `cmd/app` boots.

Authoritative companions:

- `docs/iotrack_activity_report_design.md` — all `§` references below.
- `web.frontend.vue/src/types/activity-report.type.ts` — the wire contract,
  transcribed from §18/§19.3. The Go response must marshal to exactly this.
- `web.frontend.vue/docs/features/ACTIVITY_REPORT_UI_ROADMAP.md` — UI state, invariants, and
  the fixture this service's engine tests must adopt.

## Service Role

Responsible for:

- **Reports** (first responsibility): the Activity Report — fetch telemetry,
  normalise it, segment it into journey / active_static / stationary /
  data_gap, derive the summary, return the §18 contract.
- **Alarms** (future): rule evaluation over telemetry, likely fed by RabbitMQ
  or periodic queries. Not designed yet — do not build ahead of a definition.
- **Audit** (future): audit event recording/query (§35). The `audit.view`
  permission key already exists in the seed, unused.

Explicitly **not** responsible for:

- Authentication issuing, users, or any CRUD control plane — stays in
  `web.backend.node.ts`.
- Live state — the parser owns Redis live/latest, the gateway owns Socket.IO.

Each responsibility is a separate section: its own `internal/` package and its
own route group. Reports must not import alarms; alarms must not import
reports. Shared plumbing (auth, DB, logging) lives outside all three.

## Architecture Decision: direct access, own auth

The frontend calls this service **directly** with the platform JWT, exactly as
it already does for `file.server.go`. The service validates the token itself
(HS256, shared `JWT_SECRET`) and performs its own permission and access checks
against PostgreSQL.

- JWT claims available: `sub`, `id`, `email`, `role_id`, `org_id`,
  `token_version` (`web.backend.node.ts/src/types/user-jwt.type.ts`).
- The active organisation comes **from the JWT `org_id` claim, never from the
  request body** (§20). There is no trusted path for a client-supplied org.
- The alternative (Node proxies to Go, §33) was considered and set aside: the
  file server already establishes the direct pattern, and one fewer hop keeps
  the report path simple. The frontend seam is a single URL, so this is
  reversible.

## Platform Placement

Port convention: 4000 frontend, 4001 API, 4002 files, 4003 Socket.IO —
**4004 computation** (`HTTP_PORT`, default `4004`).

Public routing (Apache, `web.frontend.vue/iotrack.live.conf`): add

```apache
ProxyPass        "/compute/"  "http://127.0.0.1:4004/compute/"
ProxyPassReverse "/compute/"  "http://127.0.0.1:4004/compute/"
```

The service mounts everything under `/compute` internally (the file server
does the same with `/img`), so paths are identical behind the proxy and bare.

Frontend: add `VITE_COMPUTE_PORT=4004` to `web.frontend.vue/.env` and compose
the URL in `appStore` the same way as the other service ports. The swap seam
is `fetchActivityReport()` in `src/stores/activityReportStore.ts` — one marked
mock block; nothing else in the UI knows data is fake.

## Project Structure

Existing:

- `cmd/app/main.go` — entrypoint; implements the boot sequence below.
- `cmd/app/settings.go` — `loadEnv()`: `DOCKERIZED` short-circuit, else
  `.env.development` / `.env` by `GO_ENV`; forces `TZ=UTC`. Keep.
- `internal/appcore/` — `App` struct (DB pool, repositories). Grows a `Config`.
- `internal/db/` — pgxpool setup with env overrides. Keep.
- `internal/models/` — **structs only**: one package (as in the parser),
  no query methods, no global session; queries live in the repository
  layer.
- `internal/logger/` — zap + lumberjack (`LOG_MODE`: file/off/dev). Keep.

Data access follows the model/repository split from
`golang_mongodb_learning_project/go-api-backend`, adapted to Postgres:
`models` holds the data shapes, `repository` holds all queries. Every
repository method takes a `context.Context` so a disconnected client cancels
its query — the parser-style active-record methods can't do that, and this
service's queries are long enough for it to matter.

The rest of the layout (mirrors `file.server.go`, `chess.log/go_backend`,
and the mongo project's repository layer) — all built:

- `internal/repository/` — one repository per entity
  (`telemetry_repository.go`, `asset_repository.go`,
  `access_repository.go`, …), each holding its pool/session explicitly;
  aggregated by a `Repository` struct in `repository.go` built by
  `NewRepository(...)`, hung on `appcore.App`. Whether a repo uses pgx or
  upper/db is its private choice: the telemetry range scan wants raw pgx,
  small lookups may keep upper.

- `internal/httpserver/` — `NewHttpServer(app, port, closedCh)`, graceful
  shutdown.
- `internal/api/middlewares/` — `jwt_auth_middleware.go` (port from the file
  server, extend to expose `role_id` and `org_id` in context), 
  `permission_middleware.go` (below).
- `internal/api/routers/` — root router (Recoverer, RequestID, CORS) mounting
  one sub-router per section: `/compute/reports`, later `/compute/alarms`,
  `/compute/audit`.
- `internal/api/handlers/` — request decode, validation, response envelope.
  Thin; no business logic.
- `internal/services/` — orchestration, following the parser's `services`
  pattern (a `Service` wrapping `App`): one file per section.
  `report_service.go` runs the report sequence — asset access checks,
  telemetry fetch via repositories, the pure engine, audit/logging. Handlers
  call services; services never touch HTTP.
- `internal/report/` — the **pure engine**: `normalise.go`, `segment.go`,
  `summary.go`, `config.go`. No HTTP, no SQL, no logger — takes
  `[]TelemetryPoint` + `JourneyConfig`, returns segments + summary. This is
  the package the §36.2 fixtures test.
- `internal/alarms/`, `internal/audit/` — empty until their first concrete
  need; reserved so sections never bleed into each other.

Deliberately absent (decided, not forgotten):

- `internal/cache` — no Redis until alarms bring a real consumer; the report
  flow is Postgres-only.
- `internal/apptypes` — exists in the parser to break import cycles; the
  import graph here is a straight line (handlers → services → repository /
  report) with no cycles. Extract shared types only when two packages need
  them and neither may import the other.
- `internal/util` — the parser's util was earned by byte/hex/CRC work shared
  across packages. Every helper this service needs so far has exactly one
  home (haversine → report, validation and envelope → handlers). Create it
  when a helper gets its second consumer.

## Startup Flow

Entrypoint: `cmd/app/main.go` (modelled on `file.server.go/cmd/web/main.go`):

1. Init logger first so boot problems are visible.
2. `loadEnv()`.
3. Init `appcore.App`: config (thresholds, limits — see Configuration).
4. Open pgxpool (`db.OpenDB()`), build repositories (`NewRepository`).
5. `signal.NotifyContext` for SIGINT/SIGTERM.
6. Start HTTP server on `HTTP_PORT` in a goroutine.
7. Block on ctx; on shutdown wait for the HTTP close channel (10s timeout),
   close the DB pool, exit.

Redis and RabbitMQ are **not** connected at boot today. They join the sequence
when alarms need them — never speculatively.

## Auth, Permission, and Access Chain

Order on every report route:

1. **JWT middleware** — Bearer token, HS256 via shared `JWT_SECRET`, reject
   otherwise; put `userID`, `roleID`, `orgID` into request context.
2. **Permission middleware** — `report.view`, mirroring
   `web.backend.node.ts/src/api/middleware/permission.middleware.ts`:
   `role_id == 1` is root bypass; otherwise the role must hold the key
   (`app.role_permissions_view`). The key must be seeded in
   `initdb-scripts/05-tables.sql` with deliberate role defaults — this is the
   same seeding the frontend sidebar gating needs (§20; frontend roadmap
   "security debt" item). One seed serves both.
3. **Asset access check** (in the report service, before any telemetry
   query, §20). Resolved by reading
   `AccessProfileController.getAccessibleAssetsForUser` in
   `web.backend.node.ts` rather than guessing from the permission model
   alone — its real logic has two parts, and only the second is what
   `AccessRepository.UserHasAssetAccess` needs to reproduce:
   - resolve `asset_uuid` → asset; 404 `ASSET_NOT_FOUND` if absent;
   - **org match**: asset's `organisation_id` must equal the JWT `org_id`,
     exactly — a field comparison, no query. This is deliberately stricter
     than Node's own org-scope-with-descendants computation
     (`Organisation.getOrgScope` + org-level overrides), which exists for
     building a switchable list of accessible organisations, not for this
     single already-known org. Reproducing that scope logic here would be
     solving a problem the JWT's `org_id` claim already answers;
   - **per-asset override**: only an explicit deny row in
     `app.user_asset_access` removes access; no row, or an explicit allow
     row, defaults to granted. This mirrors Node exactly — its own
     `getAccessibleAssetsForUser` collects per-asset "allow" overrides but
     never applies them to grant access outside the org scope (dead code in
     the Node source, marked with its own "future" comment), so an allow
     row does nothing beyond what passing the org-match check already grants;
   - groups never grant access (§20) — never consulted;
   - reject with 403 `ASSET_ACCESS_DENIED` before touching telemetry.

## Report Flow

### Endpoint

```http
POST /compute/reports/activity
```

Request (v1, §19.2): `{ asset_uuid, from, to }` — ISO timestamps, converted to
UTC on arrival. Reject `group_uuid` until multi-asset is really implemented.

Validation (§7, §30): asset required; `from < to`; range limit by tracker
category — vehicle 7 days, personal 14, asset 31 (all configurable). The
frontend enforces the same limits as a convenience; this service is the
authority.

### Response

Envelope matches the Node convention the frontend already expects
(`res.data.data`): success is `{ data: ActivityReportResponse }`; errors are
the §34 shapes with `code` values `REPORT_VALIDATION_ERROR`,
`ASSET_NOT_FOUND`, `ASSET_ACCESS_DENIED`. "No telemetry" is a **success**
with an empty-summary report, not an error (§34).

`ActivityReportResponse` must marshal field-for-field to
`web.frontend.vue/src/types/activity-report.type.ts`: camelCase keys
(`startAt`, `distanceMeters`, `speedKph`, `pointCount`, …), segments as a
discriminated union on `type`, `report.mode` naming the mode chosen.

Mode resolution (§4.3): vehicle → journey, personal → journey, asset →
timeline. `auto` stays internal; the response states what was chosen.

### Pipeline

```text
fetch (SQL) → normalise (§10) → segment (§11–§17) → summarise (§23) → respond
```

**Fetch** (§29): by `asset_id`, never by the asset's current `device_id`
(§45 — devices move between assets; rows carry `asset_id` at ingestion):

```sql
SELECT ... FROM app.telemetry
WHERE asset_id = $1 AND happened_at BETWEEN $2 AND $3
ORDER BY happened_at ASC;
```

`app.telemetry` is a hypertable partitioned on `happened_at`; single-column
indexes exist on `asset_id` and `happened_at`. Add the composite
`(asset_id, happened_at)` index (§29) when report volume justifies it.

**Normalise** (§10): the JSONB `telemetry` column holds the parser's payload:

```json
{"angle":0,"speed":0,"altitude":0,"elements":{"239":1,"240":1,"78":"1226..."},
 "latitude":36.07,"longitude":14.25,"priority":1,"timestamp":"1783280685","satellites":0}
```

Map into the internal `TelemetryPoint`: `speed`→`speedKph`, `angle`→`heading`,
element `239` (ignition) → `ignitionOn`, `240` (movement) →
`movementDetected`, activity inputs (e.g. `1` digital_input_1) →
`activityOn` per §11, invalid coordinates → `gpsValid=false`. IO id → name
mapping follows `teltonika.parser.go/internal/teltonika/IoElementsMap.go`
(78 `ibutton`, 207 `rfid`, 239 `ignition`, 240 `movement`, …). Point
`parameters` are keyed by those names.

**TelemetryPoint — pinned (Phase 2 Step 0).** The one §10 shape everything
downstream of the normaliser consumes; also the point shape the response
serves, so its JSON must satisfy the §18 `ReportPoint` contract:

```go
// internal/report — pure package: models in, points out.
type TelemetryPoint struct {
	ID        string    `json:"id"`        // row id as a STRING (§18; BIGSERIAL can pass 2^53)
	Timestamp time.Time `json:"timestamp"` // = happened_at (already UTC); payload epoch string ignored

	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`

	SpeedKph *float64 `json:"speedKph"` // nil = vendor didn't report it, never 0
	Heading  *float64 `json:"heading"`  // device angle; engine prefers course over ground (§41)
	Altitude *float64 `json:"altitude"`

	IgnitionOn       *bool `json:"ignitionOn"`       // element 239: 0/1 number → false/true; absent → nil
	ActivityOn       *bool `json:"activityOn"`       // provisional: digital_input_1; per-asset config later
	MovementDetected *bool `json:"movementDetected"` // element 240; additive vs §18, harmless
	GPSValid         bool  `json:"gpsValid"`         // additive vs §18

	Parameters map[string]any `json:"parameters,omitempty"` // parser-named keys; unknown ids keep numeric key
}
```

Rules the struct encodes (violating any is a bug):

- **Null-ables are pointers.** `nil` marshals to JSON `null` — unknown is
  never collapsed to `false` or `0` (§41.4). The dev-DB survey proved the
  nil paths are real: older rows lack element 239 entirely.
- **`id` is a JSON string**, matching §18 and immune to JS 2^53 truncation.
- **`timestamp` comes from `happened_at`**, the authoritative UTC column;
  the payload's epoch-string copy is ignored.
- **Invalid coordinates** (outside ±90/±180, or the exact 0,0 fix) set
  `gpsValid=false` and the point is KEPT — §38 says identified; dropping is
  the engine's §13 decision.
- **`parameters.ibutton` / `parameters.rfid` stay strings** end to end
  (contract rule 1 below); the payload's number `0` means "no tag" and maps
  to absent, not to a driver id.
- **Response change at Phase 2**: `points` becomes `[]TelemetryPoint`
  (Phase 1 served raw DB rows); `rawPointCount` keeps meaning rows fetched,
  and the §37 log gains accepted / invalid-GPS counts.

**Segment** (§11–§17): the pure engine in `internal/report`. State machine
per §16, thresholds from `JourneyConfig` (§40) — per-category profiles
(vehicle / personal), never hard-coded. GPS noise filtering per §13; short
stops inside a journey must not split it (§14.2); gap when points are more
than `maximumPointGapSeconds` apart (§14.7).

**Segments and response — pinned (Phase 3 Step 0).** Field names below were
read from `web.frontend.vue/src/types/activity-report.type.ts`, the
authority; re-check against it, not against memory.

The segment union is interface-based — each concrete type marshals exactly
its §18 fields, so a shape violation is a compile-time impossibility rather
than a runtime bug (a `DataGapSegment` cannot grow a points array):

```go
// internal/report/segment.go
type ActivitySegment interface{ segment() } // sealed marker

type SegmentBase struct { // embedded by every concrete type
	ID              string           `json:"id"`      // "segment-1", …
	Type            string           `json:"type"`    // the union discriminator
	StartAt         time.Time        `json:"startAt"`
	EndAt           time.Time        `json:"endAt"`
	DurationSeconds int              `json:"durationSeconds"`
	Boundary        *SegmentBoundary `json:"boundary,omitempty"` // §43
}

type JourneySegment struct { // type: "journey"
	SegmentBase
	DistanceMeters  float64          `json:"distanceMeters"`
	AverageSpeedKph *float64         `json:"averageSpeedKph"`
	MaximumSpeedKph *float64         `json:"maximumSpeedKph"`
	StartLocation   ReportLocation   `json:"startLocation"`
	EndLocation     ReportLocation   `json:"endLocation"`
	PointCount      int              `json:"pointCount"`
	Points          []TelemetryPoint `json:"points"`
	EndReason       string           `json:"endReason"` // became_active_static | became_stationary | data_gap | report_end
}

type ActiveStaticSegment struct { // type: "active_static"
	SegmentBase
	Location       ReportLocation   `json:"location"`
	PointCount     int              `json:"pointCount"`
	Points         []TelemetryPoint `json:"points"`
	ActivitySource ActivitySource   `json:"activitySource"`
}

type StationarySegment struct { // type: "stationary"
	SegmentBase
	Location   ReportLocation   `json:"location"`
	PointCount int              `json:"pointCount"`
	Points     []TelemetryPoint `json:"points"`
}

type DataGapSegment struct { // type: "data_gap" — NO points, NO route (§8.4)
	SegmentBase
	PreviousLocation *ReportLocation `json:"previousLocation"` // nullable per contract
	NextLocation     *ReportLocation `json:"nextLocation"`
}

type ReportLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	// address omitted until reverse geocoding (§28) exists.
}

type SegmentBoundary struct {
	StartsBeforeReportRange bool `json:"startsBeforeReportRange"`
	EndsAfterReportRange    bool `json:"endsAfterReportRange"`
}

type Summary struct { // §19.3 — derived from segments only, never from points (§23)
	FirstPointAt          *time.Time `json:"firstPointAt"` // null when the range is empty
	LastPointAt           *time.Time `json:"lastPointAt"`
	PointCount            int        `json:"pointCount"`
	JourneyCount          int        `json:"journeyCount"`
	TotalDistanceMeters   float64    `json:"totalDistanceMeters"`
	MovingSeconds         int        `json:"movingSeconds"`
	ActiveStaticSeconds   int        `json:"activeStaticSeconds"`
	StationarySeconds     int        `json:"stationarySeconds"`
	CommunicationGapSeconds int      `json:"communicationGapSeconds"`
}
```

The Phase 3 response replaces the interim Phase 1/2 shape wholesale (no
consumer is wired yet — the frontend still runs on its mock), becoming the
full `ActivityReportResponse`:

- `report`: `from`, `to`, `generatedAt`, `organisationId` (the JWT org),
  `mode`, `timezone`. **Timezone is "UTC" for now** — the org-timezone
  source is an open product decision (frontend roadmap, §42 Q14); revisit
  when it lands.
- `subject`: `assetId` (number — asset ids are fleet-scale, not the 2^53
  hazard telemetry row ids are), `assetUuid`, `assetName`, `trackerType`
  (from `asset_type`; nil or unknown → `"vehicle"`, consistent with the
  range-limit default). `deviceId`/`deviceExternalId` are optional in the
  contract and omitted until a device join earns its place.
- `summary`, `segments` as above.
- `mode` is `"journey"` for every tracker category in Phase 3; timeline
  mode (§4.2, scenario F) is its own later phase. §4.3's `auto` stays
  internal.

Engine input rules pinned with it:

- **§44 pre-pass**: points arrive SQL-sorted but the engine re-verifies
  order, drops exact duplicates, and **skips `gpsValid=false` points in all
  segmentation math** (§17 does the same). Consequence: invalid points
  belong to no segment — once segments replace the flat points array, they
  exist only in the §37 counters.
- **§43 v1 boundaries**: compute within the window only; the first/last
  segments touching the window edges carry the boundary flags; durations
  reflect the clipped extent so the summary reconciles. The
  look-behind/look-ahead fetch widening is deferred (Later).

**Summarise** (§23): derived from the segments, never computed separately.

### Contract rules (violations are bugs, not style)

1. `ibutton` stays a **string** end to end. It is an 18-digit id past
   JavaScript's 2^53 safe-integer range; serialised as a JSON number the last
   digits corrupt in every browser. The parser already emits it quoted —
   preserve that through normalisation and response marshalling.
2. `null` is never collapsed to `false` — unknown ignition/activity is `null`
   (§41.4). Go structs use pointer types where the contract says `| null`.
3. A data gap has no route and no points; `previousLocation`/`nextLocation`
   only (§8.4).
4. Timeline observations carry no durations, speeds, or routes (§3.3, §48).
5. Units stay raw: metres, km/h, seconds. Formatting is the frontend's job
   (§22).
6. Partial segments carry the §43 boundary flags.
7. All computation in UTC; the response names the display timezone (§21).

## Concurrency Model

- One goroutine per request (net/http default); everything downstream takes
  the request `context.Context`, so a disconnected client cancels the DB
  query and abandons the compute.
- Inside a report request, independent steps run in parallel with an
  `errgroup`: the asset/access lookups and the telemetry fetch don't wait on
  each other.
- Heavy compute is bounded by a semaphore of `REPORT_MAX_CONCURRENT`
  (default 4) so a burst of 7-day reports cannot starve the box. Requests
  over the limit wait in line — they don't fail.
- The segmentation engine itself stays single-threaded per report until
  profiling proves otherwise; a 7-day vehicle range is tens of thousands of
  points, which Go chews through sequentially. Don't parallelise the state
  machine speculatively.
- Future alarms get their own worker pool; report and alarm concurrency
  budgets must stay independent.

## Configuration

Environment (in addition to the existing `DB_*`, `LOG_*`, `DEBUG`, `GO_ENV`,
`DOCKERIZED` handled by `settings.go` / `db.go` / `logger.go`):

| Variable | Default | Meaning |
|---|---|---|
| `HTTP_PORT` | `4004` | HTTP listen port |
| `JWT_SECRET` | — (required) | shared HMAC secret, same as Node/file server |
| `REPORT_MAX_CONCURRENT` | `4` | simultaneous report computations |
| `REPORT_MAX_RANGE_DAYS_VEHICLE` | `7` | §30 |
| `REPORT_MAX_RANGE_DAYS_PERSONAL` | `14` | §30 |
| `REPORT_MAX_RANGE_DAYS_ASSET` | `31` | §30 |

`JourneyConfig` thresholds (§40) start as the design doc's vehicle/personal
profiles in `internal/report/config.go`. Promote individual values to env
vars only when tuning against real telemetry demands it — not before.

Secrets follow the repo convention: `.env` / `.env.development` with `.gpg`
copies via the root `make encrypt` / `make decrypt`.

## Contract Safety (change both sides)

- Response shape ↔ `web.frontend.vue/src/types/activity-report.type.ts`.
- Frontend seam ↔ `activityReportStore.fetchActivityReport()` URL.
- `report.view` seed ↔ `initdb-scripts/05-tables.sql`, the frontend router
  `routePermissions`, and the sidebar gating.
- Apache prefix ↔ `web.frontend.vue/iotrack.live.conf`.
- JSONB payload shape ↔ parser/db-writer output; IO naming ↔
  `IoElementsMap.go`.
- Root `Makefile`: add a `computation-build` target
  (`CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o computation-server ./cmd/app`)
  alongside the other Go targets. Like the frontend's `go-server`, a `make
  sync` ships source only — the binary must be rebuilt and restarted on the
  box.

## Implementation Roadmap

Tracks §38, adapted to this service:

- **Phase 1 — skeleton and access.** httpserver, routers, JWT + permission
  middlewares, asset access checks, validated request, telemetry range query,
  empty-result handling. Deliverable: `{ subject, rawPointCount, points: [] }`
  (§38 Phase 1). No segmentation. Acceptance: unauthorised assets rejected,
  only current-org data used, date validation works, telemetry sorted.
- **Phase 2 — normalisation.** JSONB → `TelemetryPoint`, IO mapping, UTC,
  `gpsValid`. Unit tests on real payload samples.
- **Phase 3 — pure engine.** Segmentation + summary in `internal/report`.
  **Promote the frontend fixture** (`web.frontend.vue/src/mock/activity-report.mock.ts`)
  into Go test fixtures — it was built to cover the §36.2 scenarios (partial
  segments, traffic-light stop, PTO period, 30-minute gap) for exactly this.
- **Phase 4 — wire the frontend.** Swap the store seam, seed `report.view`,
  gate the sidebar, add the Apache prefix. The mock stays for engine tests.
- **Later:** timeline mode for sparse assets (§4.2), reverse geocoding (§28),
  groups (§19.2 — intersection, never union), export, alarms, audit events
  (§35: user, org, asset, range, point count, duration, status).

Do-not list: no persisted report ids before a real need (§31); no group
support smuggled into v1; no speculative Redis/RabbitMQ connections; no
engine work inside handlers.

## Logging

Per report (§37): user ID, org ID, asset ID, range, raw/accepted/rejected
point counts, segment count, processing duration, response size, errors.
Never full telemetry payloads by default.

## Verification

```sh
cd computation.server.go
GOCACHE=/tmp/gocache go test ./...
GOCACHE=/tmp/gocache go build -o /tmp/computation-server ./cmd/app
```

Manual smoke once Phase 1 lands: obtain a JWT via the Node login, then

```sh
curl -s -X POST http://localhost:4004/compute/reports/activity \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"asset_uuid":"…","from":"2026-07-12T00:00:00Z","to":"2026-07-12T23:59:59Z"}'
```

Expect: 401 without a token, 403 for an asset outside the org or without
`report.view`, sorted telemetry counts for a valid request, and a success
envelope with an empty summary when the range holds no rows.

## Current Improvement Targets

- Phase 3 remainder (ROADMAP steps 4–8): window boundaries (§43 v1),
  summary (§23), the §36.2 fixtures, service wiring to the full
  ActivityReportResponse, acceptance.
- `BuildSegments`' `from`/`to` parameters are unused until Step 4 wires
  window clipping — expected, not an oversight.
- Later (recorded in ROADMAP "Later Phases"): frontend wiring, timeline
  mode, §43 fetch widening, geocoding, groups, alarms, audit.
