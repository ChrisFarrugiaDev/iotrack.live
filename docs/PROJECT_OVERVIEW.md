# iotrack.live Project Overview

This file is a practical orientation note for future work on `iotrack.live`.
It records the current architecture, service responsibilities, data flow, and a
recommended plan for continuing development one microservice at a time.

## What This Project Is

`iotrack.live` is an IoT tracking and telemetry platform built around Teltonika
devices. It is intended to track vehicles, personal trackers, and general
assets in real time.

The project uses a microservice architecture:

- Go services handle performance-sensitive work such as TCP device ingestion,
  Teltonika protocol parsing, file handling, and future computation.
- Node.js / TypeScript services handle the REST API, background workers, and
  realtime gateway.
- Vue 3 provides the frontend application.
- PostgreSQL stores durable application and telemetry data.
- TimescaleDB is used for time-series telemetry storage.
- Redis is used for cache, live state, command state, and pub/sub.
- RabbitMQ is used to move telemetry from the parser to the database writer.
- Socket.IO pushes live updates to browser clients.

The main product flow is:

1. A Teltonika device connects over TCP.
2. The parser identifies the device by IMEI.
3. Telemetry is parsed and dispatched.
4. Durable telemetry is written to PostgreSQL.
5. Live telemetry is published through Redis.
6. Socket.IO forwards live updates to the frontend.
7. The frontend displays asset/device state on the map and management screens.

## Current Service Map

### `teltonika.parser.go`

This is the ingestion edge of the system.

Responsibilities:

- Listens for Teltonika TCP connections.
- Handles IMEI handshake packets.
- Parses Codec 8, Codec 8 Extended, and Codec 12 packets.
- Auto-creates unknown devices in the database.
- Keeps device and organisation metadata synced between PostgreSQL, Redis, and
  local in-memory maps.
- Publishes live telemetry through Redis.
- Sends telemetry to RabbitMQ for durable database writes.
- Manages Codec 12 command state through Redis keys for pending, inflight, and
  completed/failed commands.

Important implementation notes:

- Main entrypoint: `teltonika.parser.go/cmd/parser/main.go`.
- TCP server code lives under `teltonika.parser.go/internal/tcp`.
- Parser state is held in `appcore.App`.
- The default TCP port is `5027` if `TCP_PORT` is not set.
- The default TCP timeout is `30s` if `TCP_TIMEOUT` is not set.
- Device sync routines run at startup and periodically refresh DB -> Redis ->
  in-memory state.

This service should be treated as the first priority because all downstream data
quality depends on it.

### `telemetry.db.writer.node.ts`

This service turns parser events into durable database state.

Responsibilities:

- Consumes telemetry messages from RabbitMQ.
- Persists telemetry into PostgreSQL / TimescaleDB.
- Runs cron jobs to sync each device's last telemetry from Redis to the
  database.
- Runs cron jobs to sync Teltonika Codec 12 command state from Redis to the
  database.

Important implementation notes:

- Main entrypoint: `telemetry.db.writer.node.ts/src/server.ts`.
- App bootstrap: `telemetry.db.writer.node.ts/src/App.ts`.
- RabbitMQ consumer code lives under `telemetry.db.writer.node.ts/src/rabbitmq`.
- Redis sync jobs live under `telemetry.db.writer.node.ts/src/services`.
- This service is a natural second priority after the parser because it owns
  persistence and consistency.

### `web.backend.node.ts`

This is the main REST API service.

Responsibilities:

- Authentication and JWT-based access.
- Asset APIs.
- Device APIs.
- Organisation APIs.
- User APIs.
- Group APIs.
- Access profile APIs.
- Teltonika Codec 12 command creation endpoint.
- Validation with Zod.
- Database access through Prisma.

Important implementation notes:

- Main entrypoint: `web.backend.node.ts/src/server.ts`.
- Fastify app bootstrap: `web.backend.node.ts/src/App.ts`.
- Routes are registered under `/api`.
- Router entrypoint: `web.backend.node.ts/src/api/routers/index.ts`.
- Current route groups include:
  - `/api/auth`
  - `/api/teltonika`
  - `/api/access-profile`
  - `/api/device`
  - `/api/asset`
  - `/api/user`
  - `/api/organisation`
  - `/api/group`
- The Codec 12 command API currently includes:
  - `POST /api/teltonika/codec12/commands/:imei`

This service should be improved after the ingest and persistence contracts are
clear, so its API behavior can align with stable backend data contracts.

### `socketio.gateway.node.ts`

This service is the realtime delivery layer.

Responsibilities:

- Starts a Socket.IO server.
- Subscribes to Redis pub/sub messages.
- Decodes base64 Redis messages.
- Parses telemetry JSON payloads.
- Emits `live-update` events to device-specific rooms.

Important implementation notes:

- Main entrypoint: `socketio.gateway.node.ts/src/server.ts`.
- App bootstrap: `socketio.gateway.node.ts/src/App.ts`.
- Socket.IO server code lives in `socketio.gateway.node.ts/src/socketio`.
- Redis subscriber code lives in `socketio.gateway.node.ts/src/redis`.
- Default Socket.IO port is `4003` if `SIO_PORT` is not set.

This service should be improved after the live Redis message contract is made
explicit.

### `web.frontend.vue`

This is the browser application.

Responsibilities:

- Map-first tracking UI.
- Asset, device, organisation, group, and user management screens.
- Login/logout and route protection.
- Permission-aware navigation.
- Google Maps integration.
- Socket.IO client integration.
- Pinia stores for frontend state.

Important implementation notes:

- Vite/Vue application.
- Router entrypoint: `web.frontend.vue/src/router/index.ts`.
- Main map route: `/`.
- Management routes include:
  - `/devices`
  - `/assets`
  - `/organisations`
  - `/groups`
  - `/users`
- Asset types currently include:
  - `vehicle`
  - `asset`
  - `personal`
- Map components live under `web.frontend.vue/src/components/map`.

The frontend should be polished after the backend contracts are stable, unless
the immediate goal is user-facing progress.

### `file.server.go`

This is the file/image handling service.

Responsibilities observed from the repo:

- Upload images for entities such as assets.
- Delete images.
- List images by entity type and entity ID.
- Uses Go and image-processing dependencies.

Important implementation notes:

- Main entrypoint: `file.server.go/cmd/web/main.go`.
- API routing lives under `file.server.go/internal/api`.
- Image handler code lives under `file.server.go/internal/api/handlers`.

This service can be improved independently once asset image workflows become a
priority.

### `computation.server.go`

This service appears to be planned or in progress.

Likely responsibility:

- Aggregations, analytics, or derived telemetry computations.

Important implementation notes:

- Main entrypoint: `computation.server.go/cmd/app/main.go`.
- Current structure mirrors the Go service layout used elsewhere.

This service should probably wait until telemetry storage, retention, and query
patterns are stable.

## Data Storage And Messaging

### PostgreSQL / TimescaleDB

Database setup lives under `initdb-scripts`.

Important tables observed:

- `app.organisations`
- `app.assets`
- `app.devices`
- `app.telemetry`
- `teltonika.codec12_commands`

Important behavior:

- `app.telemetry` is a TimescaleDB hypertable partitioned by `happened_at`.
- Telemetry has indexes for device, asset, and timestamp.
- Telemetry compression and retention policies are configured.
- Assets belong to organisations.
- Devices may belong to assets.
- A trigger checks that device and asset organisation relationships match.
- Organisations use a path-based hierarchy.

### Redis

Redis is used for several roles:

- Shared cache for device metadata.
- Shared cache for organisation metadata.
- Live telemetry pub/sub.
- Last telemetry state.
- Codec 12 command state.

The parser uses Redis heavily, and the writer/gateway consume Redis-derived
state. This makes Redis message/key contracts important documentation targets.

### RabbitMQ

RabbitMQ is used to move telemetry from the parser to the database writer.

Current flow:

- `teltonika.parser.go` publishes parsed telemetry messages.
- `telemetry.db.writer.node.ts` consumes messages and writes to PostgreSQL.

The RabbitMQ payload contract should be documented and tested before adding more
downstream services.

## Current Repo Observations

- `README.md` already contains a good high-level architecture overview.
- `docker-compose.yml` appears to be encrypted as `docker-compose.yml.gpg`.
- Helper scripts exist:
  - `scripts/encrypt.sh`
  - `scripts/decrypt.sh`
- Node services use Prisma schemas.
- Go services use separate `go.mod` files per service.
- The frontend has active uncommitted work in the current working tree. Future
  edits should avoid overwriting unrelated frontend changes.
- Some docs and notes are informal, but useful. The `notes/` directories contain
  architecture, operations, and learning notes.

## Recommended Development Plan

The safest way to continue is one microservice at a time.

### 1. Improve `teltonika.parser.go`

Goal: make ingestion reliable, testable, and easy to operate.

Recommended work:

- Document required environment variables and config files.
- Write down the exact TCP lifecycle:
  - connection accepted
  - IMEI handshake
  - device lookup/create
  - data packet parse
  - ACK response
  - telemetry dispatch
  - command handling
- Document Codec 8, Codec 8 Extended, and Codec 12 behavior.
- Document Redis keys used for:
  - devices
  - organisations
  - last telemetry
  - pending commands
  - inflight commands
  - command sync
- Document RabbitMQ telemetry payload shape.
- Add focused tests for packet parsing.
- Add focused tests for Codec 12 command state transitions.
- Review logging around TCP sessions so failures can be diagnosed from logs.
- Review graceful shutdown behavior.

Definition of done:

- A new developer can run the parser locally.
- Packet parsing behavior is covered by tests.
- Redis and RabbitMQ contracts are documented.
- Common TCP/device failures are logged clearly.

### 2. Improve `telemetry.db.writer.node.ts`

Goal: make persistence correct and resilient.

Recommended work:

- Document RabbitMQ input message shape.
- Document database insert shape.
- Confirm how batch consumption handles partial failures.
- Review idempotency and duplicate telemetry behavior.
- Add tests for telemetry persistence mapping.
- Add tests for malformed messages.
- Add tests or documented behavior for Redis-to-DB sync jobs.
- Clarify Codec 12 command status sync behavior.

Definition of done:

- The writer's input and output contracts are explicit.
- Common failure modes are handled or documented.
- Last telemetry sync behavior is predictable.
- Command sync behavior is predictable.

### 3. Improve `web.backend.node.ts`

Goal: make the API contract stable for the frontend and other services.

Recommended work:

- Review route naming and response shapes.
- Review auth and permission behavior.
- Confirm Zod validation matches the actual data model.
- Document public REST endpoints.
- Add focused route/controller tests where practical.
- Align asset, device, organisation, group, and user APIs with frontend needs.
- Clarify how Codec 12 commands move from API request to Redis/database state.

Definition of done:

- API behavior is documented.
- Validation and permissions are consistent.
- Frontend-facing response shapes are stable.

### 4. Improve `socketio.gateway.node.ts`

Goal: make realtime behavior explicit and robust.

Recommended work:

- Document the Redis pub/sub channel and message shape.
- Document Socket.IO room naming.
- Document emitted events, especially `live-update`.
- Add validation around malformed Redis messages.
- Decide whether Socket.IO connections need JWT authentication.
- Add tests or small integration checks for message forwarding.

Definition of done:

- A frontend developer can understand exactly how live updates arrive.
- Malformed messages do not crash or pollute the gateway.
- Room/event contracts are stable.

### 5. Improve `web.frontend.vue`

Goal: polish workflows once backend contracts are stable.

Recommended work:

- Review map live-update flow.
- Review asset/device linking workflows.
- Review permission-based navigation.
- Review loading/error/empty states.
- Improve consistency across management views.
- Add UI tests only after key flows stabilize.

Definition of done:

- Core tracking and management workflows are clear and predictable.
- Frontend state matches backend contracts.
- User-facing errors are understandable.

### 6. Define `computation.server.go`

Goal: only build analytics once telemetry storage/query needs are clear.

Recommended work:

- Decide what computations are needed first.
- Define input source:
  - direct database query
  - RabbitMQ stream
  - Redis state
- Define output destination:
  - database tables
  - Redis cache
  - API response only
- Add the smallest useful computation first.

Definition of done:

- The service has a concrete first responsibility.
- It does not duplicate parser or writer behavior.

## Suggested Next Step

Start with `teltonika.parser.go`.

Recommended first task:

> Create a parser service contract document that records environment variables,
> TCP packet flow, Redis keys, RabbitMQ payloads, and Codec 12 command lifecycle.

After that, improve or add tests around the parser behavior that is already
implemented.

This keeps the work grounded in the most important service without forcing a
large rewrite.

