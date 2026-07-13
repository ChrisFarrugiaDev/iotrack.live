# iotrack.live System Spec

## Purpose

`iotrack.live` is a microservice-based IoT tracking and telemetry platform for
Teltonika devices. It ingests device TCP traffic, persists telemetry, delivers
live map updates, exposes a management REST API, and provides a Vue dashboard.

This root spec gives clean-session context for the whole repo. For deeper
service details, read each service's local `SPEC.md`, `AGENTS.md`, and analysis
notes where present.

## Service Map

### `teltonika.parser.go`

Ingestion edge for device traffic.

Responsibilities:

- Accept Teltonika TCP connections.
- Handle IMEI handshake.
- Parse Codec 8, Codec 8 Extended, and Codec 12 packets.
- Auto-create unknown devices.
- Publish telemetry to RabbitMQ for durable storage.
- Publish live telemetry to Redis Pub/Sub.
- Maintain latest telemetry state.
- Manage Codec 12 command lifecycle.
- Sync `app.organisations` rows into the shared Redis
  `iotrack.live:organisations` hash (startup + periodic); the backend reads
  maps/AI key inheritance from this hash.

Important docs:

- `teltonika.parser.go/SPEC.md`
- `teltonika.parser.go/ROADMAP.md`
- `teltonika.parser.go/AGENTS.md`

### `teltonika.replay.go`

CSV-based telemetry replay service (derived from the parser) for testing and
demos.

### `telemetry.db.writer.node.ts`

Persistence worker.

Responsibilities:

- Consume RabbitMQ telemetry messages.
- Batch insert telemetry into PostgreSQL/TimescaleDB.
- Sync latest telemetry from Redis to device rows.
- Sync Codec 12 command results from Redis to PostgreSQL.

### `socketio.gateway.node.ts`

Realtime delivery layer.

Responsibilities:

- Subscribe to Redis channel `teltonika:live`.
- Parse live telemetry payloads.
- Emit `live-update` to Socket.IO device rooms.
- Bridge live parser output to browser clients.

### `web.backend.node.ts`

Main REST API.

Responsibilities:

- Authentication and JWT token-version validation.
- Access profile hydration.
- Backend authorization.
- Device, asset, organisation, group, and user APIs.
- Teltonika Codec 12 command creation (auth + Zod validation +
  `device.command` permission).
- Prisma access to PostgreSQL.
- Redis cache and command queue interaction.

Important docs:

- `web.backend.node.ts/SPEC.md`
- `web.backend.node.ts/AGENTS.md`
- `web.backend.node.ts/BACKEND_ANALYSIS.md`

### `web.frontend.vue`

Operational dashboard and map UI.

Responsibilities:

- Login and authenticated app shell.
- Access-profile hydration.
- Permission-aware route/UI behavior.
- Map-first live tracking.
- Device, asset, organisation, group, and user screens.
- Socket.IO live telemetry consumption.
- Image workflow UI.

Important docs:

- `web.frontend.vue/SPEC.md`
- `web.frontend.vue/AGENTS.md`
- `web.frontend.vue/docs/FRONTEND_ANALYSIS.md`

### `file.server.go`

Image/file service.

Responsibilities:

- Upload images/files.
- List files by entity.
- Delete or update images/files.
- Store files under the configured upload volume.

### `computation.server.go`

Early-stage computation service.

Current status:

- Prototype only.
- Do not assume it is production-shaped.
- Define one concrete computation responsibility before adding deployment or
  frontend/API dependencies.

## Infrastructure

PostgreSQL / TimescaleDB:

- Durable app data.
- Telemetry time-series data.
- Codec 12 command records.
- Users, roles, permissions, organisations, assets, devices, groups, images,
  and files.

Redis:

- Shared device and organisation cache (`iotrack.live:organisations` is
  written by the parser; a flush leaves maps/AI keys unavailable until the
  parser resyncs).
- Latest telemetry state.
- Live Pub/Sub channel.
- Codec 12 pending/inflight/sync command state.
- Auth token-version and permission caches in the backend.

RabbitMQ:

- Durable telemetry handoff from parser to writer.

Socket.IO:

- Browser realtime delivery from gateway to frontend.

Docker Compose:

- Includes PostgreSQL, Redis, RabbitMQ, backend, writer, gateway, parser, and
  file server.
- Frontend and computation service are not currently part of the main compose
  service list.

## Main Flows

### Durable Telemetry

1. Device connects to `teltonika.parser.go`.
2. Parser identifies the IMEI and parses telemetry.
3. Parser sends telemetry JSON to RabbitMQ.
4. `telemetry.db.writer.node.ts` consumes and writes telemetry to
   PostgreSQL/TimescaleDB.

### Live Telemetry

1. Parser publishes plain JSON to Redis channel `teltonika:live`.
2. `socketio.gateway.node.ts` receives the message.
3. Gateway emits `live-update` to `device:<device_id>` rooms.
4. Frontend updates device telemetry and map marker state.

### Access Profile

1. User logs in through backend.
2. Frontend stores JWT.
3. Frontend fetches `/api/access-profile`.
4. Backend computes organisation scope, assets, devices, settings, permissions,
   roles, groups, and user identity.
5. Frontend hydrates Pinia stores.

### Codec 12 Commands

1. Backend receives command creation request.
2. Backend writes command rows to PostgreSQL.
3. Backend pushes commands to
   `teltonika.parser.go:codec12:pending-commands:<imei>`.
4. Parser sends commands to devices.
5. Parser writes result state to Redis.
6. Writer syncs status back to PostgreSQL.

### Images/Files

1. Frontend opens image workflows.
2. Requests go to `file.server.go` under `/img/`.
3. File server handles storage and database records.

## Current Known Risks

- Parser RabbitMQ publishing should be hardened when the producer/channel is
  unavailable.
- Parser Redis-dependent tests should be gated so normal tests do not require a
  live Redis instance.
- Writer needs explicit malformed message and DLQ/failure policy.
- Gateway should eventually validate live message shape more strongly and
  decide Socket.IO auth/room authorization.
- Backend should scope list endpoints by user access (Codec 12 command route is
  now secured).
- Frontend should centralize runtime URL handling and align route guards with
  backend permissions.
- Frontend currently depends on `authorization.permissions`; keep backend and frontend access-profile shape coordinated.
- Go frontend server route handling should be checked when adding SPA routes.
- Computation service needs a defined first responsibility.

## Documentation Map

Parent docs:

- `README.md` gives the public high-level overview.
- `docs/PROJECT_OVERVIEW.md` gives service orientation.
- `docs/PROJECT_ANALYSIS.md` gives current analysis and priorities.
- `AGENTS.md` gives repo-wide agent instructions.
- `SPEC.md` gives this system-level contract.

Service docs:

- `teltonika.parser.go/SPEC.md`
- `teltonika.parser.go/ROADMAP.md`
- `teltonika.parser.go/AGENTS.md`
- `web.backend.node.ts/SPEC.md`
- `web.backend.node.ts/AGENTS.md`
- `web.backend.node.ts/BACKEND_ANALYSIS.md`
- `web.frontend.vue/SPEC.md`
- `web.frontend.vue/AGENTS.md`
- `web.frontend.vue/docs/FRONTEND_ANALYSIS.md`

## Development Approach

Work one service at a time unless the task is explicitly cross-service.

Recommended order:

1. Parser reliability and tests.
2. Writer contracts and failure behavior.
3. Realtime Redis/Socket.IO contracts.
4. Backend auth, permission, and API contract stability.
5. Frontend polish against stable backend/realtime contracts.
6. Computation service definition.

Keep docs current when behavior or contracts change.
