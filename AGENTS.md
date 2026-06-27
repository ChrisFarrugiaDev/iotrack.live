# Codex Instructions for `iotrack.live`

## Before Editing

- This is a multi-service IoT platform. Identify which microservice owns the
  behavior before editing.
- Read the service-local `AGENTS.md` and `SPEC.md` when they exist.
- Read `docs/PROJECT_ANALYSIS.md` for the current parent-level architecture
  analysis and priority order.
- Keep changes scoped. Do not refactor across services unless the user asks for
  a cross-service change.
- Preserve unrelated work in the working tree.
- Do not change API response shapes, Redis keys, RabbitMQ payloads, Socket.IO
  events, or database contracts without checking the producer and consumer.

## System Context

`iotrack.live` is an IoT tracking and telemetry platform built around Teltonika
devices.

Main services:

- `teltonika.parser.go` ingests Teltonika TCP traffic.
- `telemetry.db.writer.node.ts` persists telemetry and syncs Redis state to DB.
- `socketio.gateway.node.ts` forwards live Redis telemetry to Socket.IO.
- `web.backend.node.ts` exposes the REST API.
- `web.frontend.vue` provides the Vue dashboard and map UI.
- `file.server.go` handles image/file workflows.
- `computation.server.go` is still early prototype work.

Infrastructure:

- PostgreSQL/TimescaleDB stores durable app and telemetry data.
- Redis stores cache, live state, command state, and Pub/Sub messages.
- RabbitMQ carries durable telemetry from parser to writer.
- Socket.IO delivers live browser updates.

## Core Data Flows

Durable telemetry:

1. Teltonika device connects to `teltonika.parser.go`.
2. Parser handles IMEI handshake and parses Codec 8, Codec 8 Extended, or
   Codec 12 packets.
3. Parser publishes telemetry to RabbitMQ.
4. `telemetry.db.writer.node.ts` consumes RabbitMQ and writes PostgreSQL /
   TimescaleDB rows.

Realtime telemetry:

1. Parser publishes plain JSON live telemetry to Redis channel `teltonika:live`.
2. `socketio.gateway.node.ts` subscribes to Redis.
3. Gateway emits `live-update` to device-specific Socket.IO rooms.
4. `web.frontend.vue` updates device state and map markers.

Management/API:

1. `web.frontend.vue` calls `web.backend.node.ts` under `/api/*`.
2. Backend authenticates, validates, authorizes, and reads/writes PostgreSQL and
   Redis.
3. Access profile hydrates frontend stores for organisations, assets, devices,
   permissions, groups, settings, and user identity.

Codec 12 command flow:

1. Backend creates command rows and pushes pending commands to Redis under the
   `teltonika.parser.go:` prefix.
2. Parser sends commands to connected devices.
3. Parser writes command result state to Redis.
4. Writer syncs command status back to PostgreSQL.

Image/file flow:

- Frontend/backend use `file.server.go` for `/img/` image upload, list, update,
  and delete behavior.

## Service Ownership

- Parser owns Teltonika protocol handling, Redis live publishing, RabbitMQ
  telemetry publishing, latest telemetry state, and Codec 12 device command
  lifecycle.
- Writer owns RabbitMQ telemetry consumption, bulk inserts, latest telemetry DB
  sync, and Codec 12 status DB sync.
- Gateway owns Redis Pub/Sub subscription and Socket.IO room/event forwarding.
- Backend owns REST API contracts, auth, permission checks, Zod validation,
  Prisma data access, access profile, and command creation.
- Frontend owns user-facing dashboard behavior, route guards, Pinia stores, map
  rendering, and live UI updates.
- File server owns file upload/storage/image operations.
- Computation server should not be treated as production-shaped until its first
  concrete responsibility is defined.

## Working Style

- Prioritize readability and understanding.
- Prefer direct, step-by-step code over clever abstractions.
- Use clear names and simple control flow.
- Add short comments only where they explain intent, contracts, or non-obvious
  workflow.
- Keep local conventions. In Go services, preserve readable flow and separator
  comments where already used. In Vue/TypeScript services, follow the existing
  route/view/store/component pattern.
- Avoid broad rewrites while contracts are still moving.
- Put durable analysis or decisions in repo docs, not only chat.

## Contract Safety

Check both sides before changing:

- Redis keys or payloads.
- RabbitMQ exchange/routing key/message shape.
- Socket.IO event names or room naming.
- REST response shapes.
- Prisma/database field assumptions.
- Access-profile shape consumed by frontend.
- File/image URL contracts.

Known current contract details:

- Redis live channel is `teltonika:live`.
- Live Redis payload is plain JSON; gateway still has legacy base64 fallback.
- Parser-owned Redis keys use prefix `teltonika.parser.go:`.
- Shared app Redis metadata commonly uses prefix `iotrack.live:`.
- Frontend currently consumes backend access-profile key
  `authorization.permissoins`; do not rename without coordinating backend and
  frontend.

## Verification

Use service-local checks.

Parser:

```sh
cd teltonika.parser.go
GOCACHE=/tmp/gocache go test ./internal/tcp ./internal/teltonika ./internal/util
```

Backend:

```sh
cd web.backend.node.ts
npm run build
```

Frontend:

```sh
cd web.frontend.vue
npm run build
```

Frontend Go server:

```sh
cd web.frontend.vue/go-server
GOCACHE=/tmp/gocache go test ./...
```

Socket.IO gateway:

```sh
cd socketio.gateway.node.ts
npm run build
```

Notes:

- Some Go commands need `GOCACHE=/tmp/gocache` in this environment.
- Full parser `go test ./...` may fail if Redis is not available for
  integration-style tests.
- For docs-only changes, do not run builds unless needed.

## Current Priority Order

1. Harden `teltonika.parser.go` contracts and reliability.
2. Tighten `telemetry.db.writer.node.ts` persistence/failure behavior.
3. Lock down realtime Redis/Socket.IO contracts.
4. Stabilize `web.backend.node.ts` API, auth, and permission behavior.
5. Polish `web.frontend.vue` after backend contracts stabilize.
6. Define `computation.server.go` only after the first computation need is
   concrete.

## Commit Guidelines

Do not add a `Co-Authored-By: Claude ...` trailer (or any AI co-author) to commits. Commits should list only the human author.
