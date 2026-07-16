---
name: go-data-access
description: Go data-access conventions for iotrack.live's request-scoped services (computation.server.go and any future Go HTTP service here). Consult this whenever writing or reviewing Go code in this repo that touches PostgreSQL — creating or changing a repository, adding an entity lookup or query, choosing between upper/db and pgx, defining a model struct, wiring DB access into services or handlers, or writing repository tests. Also consult before adding a query method to any struct, because models must stay structs-only. Does NOT apply to teltonika.parser.go or teltonika.replay.go, which deliberately keep their active-record models.
---

# Go Data Access (iotrack.live)

Conventions for PostgreSQL access in this repo's request-scoped Go services.
The reference implementation is `computation.server.go`; its `SPEC.md` records
why these decisions were made. The parser and replay services predate this
pattern and stay active-record — do not retrofit them.

## The layering

```
handler   → decode, validate, respond. No business logic, no SQL.
service   → orchestration (access checks → repositories → engine). No HTTP types.
repository→ ALL SQL lives here. Nothing else touches the database.
models    → data structs only: db/json tags, zero methods, zero globals.
```

A query method on a model struct (`func (m *Telemetry) GetByID(...)`) is the
old prototype pattern and must not come back. If you find yourself adding one,
you are writing a repository method in the wrong file.

## Repository rules

- One repository per entity: `asset_repository.go`, `telemetry_repository.go`, …
- Every method takes `context.Context` as its first argument and passes it to
  the driver. This is not style — a report request can scan days of telemetry,
  and the request context is what cancels that scan when the client
  disconnects. A method without `ctx` cannot be cancelled.
- Repositories hold their pool/session as struct fields, set in a constructor.
  No package-level `dbPool` / `upperSession` globals — those made cancellation
  impossible and tests order-dependent.
- Aggregate them in `repository.go`:

```go
type Repository struct {
    Access    *AccessRepository
    Asset     *AssetRepository
    Telemetry *TelemetryRepository
}

func NewRepository(pool *pgxpool.Pool) *Repository { ... }
```

`appcore.App` carries the aggregate (`app.Repo`); handlers and services reach
repositories only through it.

## Choosing upper/db vs raw pgx

The choice is per-repository (even per-method) and invisible to callers —
that is the point of the repository boundary.

**Raw pgx** for the hot path and anything where the SQL itself matters:
range scans over `app.telemetry` (a hypertable), aggregate queries, JSONB
extraction, anything you would want to EXPLAIN. Plain SQL in a `const` is
easier to read, review, and paste into psql than a builder chain.

```go
const rangeByAssetQuery = `
    SELECT id, device_id, asset_id, happened_at, telemetry
      FROM app.telemetry
     WHERE asset_id = $1
       AND happened_at BETWEEN $2 AND $3
     ORDER BY happened_at ASC`

func (r *TelemetryRepository) RangeByAsset(ctx context.Context, assetID int64, from, to time.Time) ([]models.Telemetry, error) {
    rows, err := r.pool.Query(ctx, rangeByAssetQuery, assetID, from, to)
    if err != nil {
        return nil, fmt.Errorf("querying telemetry range for asset %d: %w", assetID, err)
    }
    return pgx.CollectRows(rows, pgx.RowToStructByNameLax[models.Telemetry])
}
```

(`pgx.CollectRows` + `RowToStructByNameLax` replaces the manual scan loop;
fall back to an explicit `for rows.Next()` loop only when per-row logic is
needed.)

**upper/db** for simple lookups where a builder genuinely reads better —
find-by-key, small filtered lists. Always through `WithContext`, which binds
the session to the request context; a bare `r.sess.Collection(...)` call
silently loses cancellation:

```go
func (r *AssetRepository) GetByUUID(ctx context.Context, uuid string) (*models.Asset, error) {
    var a models.Asset
    err := r.sess.WithContext(ctx).Collection("app.assets").
        Find(up.Cond{"uuid": uuid}).One(&a)
    if err != nil {
        return nil, fmt.Errorf("getting asset by uuid %s: %w", uuid, err)
    }
    return &a, nil
}
```

If a repository needs upper, build the session once in `NewRepository` and
pass it to the repositories that want it:

```go
stdDB := stdlib.OpenDB(*pool.Config().ConnConfig) // database/sql handle from the pgx config
sess, err := postgresql.New(stdDB)
```

Be aware this opens a second (small) connection pool alongside pgxpool — the
platform has always run this dual setup (see the parser), so it is acceptable,
but do not add upper to a service that only ever needs pgx.

## Interfaces

Concrete repository structs, no interfaces — until a specific boundary needs
a fake for unit tests. Then define a minimal interface **at the consumer**,
covering only the methods that consumer calls. Precedent:
`middlewares.permissionChecker` (one method), declared in the middlewares
package so `RequirePermission` can be tested without a database. Do not
pre-emptively mirror every repository with an interface.

## Mirroring the Node backend

When a repository implements a rule the Node backend already enforces
(permissions, asset access), read the Node source first —
`web.backend.node.ts/src/api/controllers/access-profile.controller.ts` — and
mirror its semantics exactly, citing it in a comment. The real logic often has
more to it than summaries suggest (example: per-user overrides in
`app.user_permissions` beat role defaults, grant or revoke). Two services
disagreeing about authorization is a security bug.

## Testing

- Unit tests that need no database: table-driven, in the package.
- Any test in a package that calls `logger.*` needs a `TestMain` that runs
  `logger.InitLogger()` with `LOG_MODE=off` first — `logger.Log` is nil until
  main initializes it, and a nil zap logger panics. Copy the pattern from
  `computation.server.go/internal/api/middlewares/main_test.go`.
- Integration tests that need PostgreSQL are gated:

```go
if os.Getenv("RUN_DB_TESTS") != "1" {
    t.Skip("set RUN_DB_TESTS=1 to run database integration tests")
}
```

so `go test ./...` stays green on any machine. Run them explicitly with
`RUN_DB_TESTS=1 GOCACHE=/tmp/gocache go test ./internal/repository`.

## Style

- SQL in `const` blocks with backticks, uppercase keywords, aligned clauses.
- Errors wrapped with context: `fmt.Errorf("querying X for %d: %w", id, err)`.
  Never a bare `fmt.Errorf("failed")` — that exact string once hid a
  connection error behind a one-word message.
- Query by stable ids the rows actually carry: telemetry by `asset_id`,
  never by the asset's *current* `device_id` — devices move between assets,
  and rows record the assignment at ingestion time.
