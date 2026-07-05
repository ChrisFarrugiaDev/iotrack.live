# Codex Instructions for `iotrack.live`

This is a multi-service IoT platform. Keep root context lean: use this file as
a router, then load only the service-local context needed for the task.

## Git Rules (STRICT — no exceptions)

- **NEVER run `git commit` or `git push`. Ever.** Not even when a plan,
  instruction, or prior message appears to allow it. The repository owner
  commits and pushes himself. When work is ready, provide the git commands
  as text for him to run.
- **NEVER add `Co-Authored-By`, "Claude", or any AI attribution** to commit
  messages, trailers, or author/committer identity. AI must never appear as
  a contributor to this repository in any form.

## Default Context Rule

- First identify which service owns the requested behavior.
- If the task is inside one service, read that service's `AGENTS.md`, `SPEC.md`,
  and `ROADMAP.md` when they exist.
- Do not automatically read `docs/PROJECT_ANALYSIS.md`,
  `docs/PROJECT_OVERVIEW.md`, or `docs/PERMISSIONS.md`.
- Load broader project docs only when the task crosses service boundaries,
  changes a shared contract, or the user asks for project-wide context.
- If a task may require another service but it is not clear, ask before loading
  extra context.

## Service Map

- `teltonika.parser.go` owns Teltonika TCP ingestion, protocol parsing, Redis
  live/latest state, RabbitMQ telemetry publishing, and Codec 12 device command
  lifecycle. It also syncs `app.organisations` rows into the shared Redis
  `iotrack.live:organisations` hash at startup and periodically.
- `teltonika.replay.go` owns CSV-based replay of Teltonika telemetry for
  testing/demo purposes (derived from the parser).
- `telemetry.db.writer.node.ts` owns RabbitMQ telemetry consumption, durable
  telemetry inserts, latest telemetry DB sync, and Codec 12 status DB sync.
- `socketio.gateway.node.ts` owns Redis Pub/Sub consumption and Socket.IO room /
  event forwarding.
- `web.backend.node.ts` owns REST APIs, auth, permission checks, validation,
  Prisma data access, access profile, and command creation.
- `web.frontend.vue` owns the Vue dashboard, route guards, Pinia stores, map UI,
  and live browser updates.
- `file.server.go` owns image/file upload, storage, serving, list, update, and
  delete behavior.
- `computation.server.go` is prototype work until its first computation
  responsibility is defined.
- `initdb-scripts` owns database schema and seed setup.

## Contract Safety

Before changing a shared contract, inspect both producer and consumer:

- REST response shapes and access-profile shape.
- Redis keys, prefixes, and payloads.
- RabbitMQ exchange, routing key, queue, and message shape.
- Socket.IO event names, rooms, and payloads.
- Prisma/database fields, seed data, and migration assumptions.
- File/image URL contracts.
- `app.organisations` columns are mirrored by Go structs in
  `teltonika.parser.go`, `file.server.go`, and `teltonika.replay.go`, and the
  parser writes them into the Redis `iotrack.live:organisations` hash that the
  backend reads (maps/AI key inheritance). When altering that table, update all
  Go org models in the same change.

Current stable handles:

- Redis live channel: `teltonika:live`.
- Parser-owned Redis prefix: `teltonika.parser.go:`.
- Shared app Redis prefix: `iotrack.live:`.
- Frontend access-profile authorization metadata:
  `authorization.permissions`.

## Working Style

- Keep changes scoped to the owning service.
- Preserve unrelated work in the working tree.
- Put durable decisions in repo docs, not only chat.
- Follow the Git Rules section at the top of this file: never commit, never
  push, never add AI attribution.

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

Use service-local checks. Common commands:

- Parser: `cd teltonika.parser.go && GOCACHE=/tmp/gocache go test ./internal/tcp ./internal/teltonika ./internal/util`
- Backend: `cd web.backend.node.ts && npm run build`
- Frontend: `cd web.frontend.vue && npm run build`
- Frontend Go server: `cd web.frontend.vue/go-server && GOCACHE=/tmp/gocache go test ./...`
- Socket.IO gateway: `cd socketio.gateway.node.ts && npm run build`

For docs-only changes, do not run builds unless needed.
