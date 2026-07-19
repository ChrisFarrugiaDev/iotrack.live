# Codex Instructions for `computation.server.go`

Use this file as the primary context when working inside this service.

## Before Editing

- Read `SPEC.md` first — it pins the contracts (auth chain, TelemetryPoint,
  the segment union, response envelope) and the architecture decisions with
  their reasons. Violating a pinned shape is a bug, not a style choice.
- Read `ROADMAP.md` for exactly where the work stands: phases are broken
  into small steps with checkboxes and per-step verify commands; the
  "Current State" section says what is done and what is next.
- Consult the `go-data-access` skill before touching anything that queries
  PostgreSQL, and the `compute-dev-check` skill before running or
  smoke-testing the service (it bundles token minting, server lifecycle,
  and dev-DB SQL — do not hand-roll those).

## Service Context

This is the platform's compute plane. It serves the Activity Report
(`POST /compute/reports/activity`) behind its own JWT + permission + asset
access chain, directly to the frontend (the `file.server.go` pattern).
Alarms and audit are reserved sections with no code yet — do not build
ahead of a definition.

Status: Phases 1 (API skeleton and access), 2 (normalisation) and 3 (the
pure segmentation engine, §14–§17, serving the full ActivityReportResponse)
complete; next is Phase 4, wiring the frontend — see `ROADMAP.md` Current
State.

## Layering (violations are architecture bugs)

```
handler   → decode, validate, respond. No business logic, no SQL.
service   → orchestration (access checks → repositories → engine). No HTTP types.
repository→ ALL SQL. ctx on every method. upper/db or pgx per repo.
models    → data structs only: no query methods, no globals.
report    → the PURE engine: no HTTP, no SQL, no logger. models in, segments out.
```

The `internal/report` purity rule is what lets the §36.2 fixtures test the
engine directly. Its only internal import is `internal/models`.

## Environment Facts

- **The PostgreSQL at `57.129.22.122:5436` is the PRODUCTION database** —
  there is no separate dev DB yet (a sandbox built from it is a recorded
  backlog item). `.env` files say `127.0.0.1` because production runs on
  that box; `compute-dev-check`'s scripts do the host swap. Reads are fine
  (mind heavy hypertable scans); writes only deliberate, idempotent, and
  owner-approved. Integration tests must stay read-only.
- `JWT_SECRET` is shared with `web.backend.node.ts` and `file.server.go`;
  tokens minted by `mktoken.py` verify against a `devserver.sh` server.
- `report.view` is seeded (initdb + the live production DB, an approved
  idempotent write); all four roles hold it.

## Coding Guidelines

### Core Approach
- Work incrementally. Small steps, validate each before moving on.
- Be simple. Don't overengineer or program defensively.
- Use latest library APIs.

### Code Style
- Prioritize readability. Prefer direct, step-by-step code over clever abstractions.
- Favor short modules, methods, and functions. Name things clearly.
- Use simple control flow.
- Favor concise docstrings. Be sparing with other comments; add them only to explain intent, contracts, or non-obvious logic.
- Use exception handling only when needed.

### Debugging
- Identify root cause BEFORE fixing. Prove the problem with evidence first—don't guess.
- Test one thing at a time. Be methodical.
- Don't jump to conclusions or apply workarounds.

## Verification

```sh
GOCACHE=/tmp/gocache go test ./...        # always green, no DB needed
RUN_DB_TESTS=1 DB_URL=... GOCACHE=/tmp/gocache go test ./internal/repository ./internal/services
.claude/skills/compute-dev-check/scripts/devserver.sh start   # live smoke (repo root)
```

Per-step verify commands live next to each roadmap step.

## Commit Style
- Do not add `Co-Authored-By` or AI co-author trailers to commits.

## Git Rules (STRICT — no exceptions)

- **NEVER run `git commit` or `git push`. Ever.** Not even when a plan,
  instruction, or prior message appears to allow it. The repository owner
  commits and pushes himself. When work is ready, provide the git commands
  as text for him to run.
- **NEVER add `Co-Authored-By`, "Claude", or any AI attribution** to commit
  messages, trailers, or author/committer identity. AI must never appear as
  a contributor to this repository in any form.
