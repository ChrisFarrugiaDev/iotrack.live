# computation.server.go

The platform's compute plane: heavy work over telemetry stored in
TimescaleDB — the Activity Report first, alarms and audit later. The frontend
only formats what this service returns; `web.backend.node.ts` keeps auth
issuing and CRUD.

Read `SPEC.md` for the full contract (architecture decisions, auth chain,
report pipeline, configuration, phased roadmap) and `AGENTS.md` for working
rules. Design references (`§`) point at
`docs/iotrack_activity_report_design.md` in the repo root.

Status: Phases 1 (API skeleton and access) and 2 (normalisation) complete —
the endpoint serves normalised §10 points behind the full auth chain.
Phase 3 (the pure segmentation engine) in progress: movement primitives,
the §18 segment union, and the §17 state machine exist; window boundaries,
summary, fixtures, and wiring remain. See ROADMAP.md Current State.

## Directory Structure

```
cmd/
  app/                entrypoint: main.go (boot sequence), settings.go (env loading)

internal/
  appcore/            App struct — config, DB pool, repositories; owned wiring
  db/                 pgxpool setup with env overrides
  logger/             zap + lumberjack (LOG_MODE: file / off / dev)
  httpserver/         HTTP server with graceful shutdown

  api/
    routers/          root router (Recoverer, RequestID, CORS) + one sub-router
                      per section: /compute/reports, later /compute/alarms, /compute/audit
    middlewares/      JWT auth (shared JWT_SECRET), permission check (report.view)
    handlers/         request decode, validation, response envelope — thin, no business logic

  models/             data structs only (db/json tags) — no query methods, no globals
  repository/         all data access: one repository per entity, every method
                      takes a context.Context; aggregated by Repository on appcore.App
  services/           orchestration, one file per section (report_service.go, …):
                      access checks → repositories → engine → audit; the layer
                      between thin handlers and pure engines (parser pattern)

  report/             the pure segmentation engine — no HTTP, no SQL, no logger;
                      []TelemetryPoint + JourneyConfig in, segments + summary out
  alarms/             reserved — empty until alarms have a concrete definition
  audit/              reserved — empty until audit has a concrete definition

notes/                working notes
```

Sections stay isolated: `report`, `alarms` and `audit` never import each
other; shared plumbing (auth, DB, logging) lives outside all three.
`models`/`repository` follow the split from the mongodb learning project:
shapes in one package, queries in the other.

## Run

```sh
go run ./cmd/app          # uses .env.development unless GO_ENV=production
```

HTTP listens on `HTTP_PORT` (default `4004`), routes mounted under `/compute`.

## Verify

```sh
GOCACHE=/tmp/gocache go test ./...
GOCACHE=/tmp/gocache go build -o /tmp/computation-server ./cmd/app
```
