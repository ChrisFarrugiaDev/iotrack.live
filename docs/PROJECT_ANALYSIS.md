# iotrack.live Project Analysis

This note summarizes the current shape of the `iotrack.live` microservice
project and the recommended development priorities.

## High-Level Read

`iotrack.live` is structured as an IoT telemetry platform with a clean
microservice split:

- `teltonika.parser.go` is the ingestion edge.
- `telemetry.db.writer.node.ts` persists telemetry.
- `socketio.gateway.node.ts` delivers realtime updates.
- `web.backend.node.ts` exposes the REST API.
- `web.frontend.vue` provides the dashboard and map UI.
- `file.server.go` handles image/file workflows.
- `computation.server.go` is still early prototype work.

The strongest architectural decision is the split between durable telemetry and
live telemetry:

- Durable flow:
  `teltonika.parser.go` -> RabbitMQ -> `telemetry.db.writer.node.ts` ->
  PostgreSQL/TimescaleDB.
- Realtime flow:
  `teltonika.parser.go` -> Redis Pub/Sub -> `socketio.gateway.node.ts` ->
  `web.frontend.vue`.
- Management/API flow:
  `web.frontend.vue` -> `web.backend.node.ts` -> PostgreSQL/Redis.
- Image/file flow:
  frontend/backend -> `file.server.go`.
- Future analytics flow:
  `computation.server.go`, once the first computation responsibility is clear.

The architecture is sound. The next work should focus on contract hardening and
operational reliability rather than adding more services.

## Service Analysis

### `teltonika.parser.go`

This is the core service and highest-priority component.

Responsibilities:

- Accept Teltonika TCP connections.
- Handle IMEI handshakes.
- Parse Codec 8, Codec 8 Extended, and Codec 12 packets.
- Auto-create unknown devices.
- Publish durable telemetry to RabbitMQ.
- Publish live telemetry to Redis Pub/Sub.
- Maintain latest telemetry state in memory and Redis.
- Manage Codec 12 pending, inflight, completed, and failed command state.

Assessment:

- This service is the source of truth for incoming device data quality.
- Bad parsing, stale metadata, or failed publishing here affects every
  downstream service.
- The Redis live payload encoding issue is complete: live messages now publish
  existing JSON bytes directly.

Current priorities:

- Harden RabbitMQ publishing when the producer/channel is unavailable.
- Make Redis-dependent tests explicit, for example behind `RUN_REDIS_TESTS=1`.
- Add focused parser tests with real Teltonika packet examples.
- Review latest telemetry locking with the race detector after tests exist.
- Only revisit TCP packet read behavior if real partial/combined-read parser
  errors appear.

### `telemetry.db.writer.node.ts`

This service turns parser events into durable database state.

Responsibilities:

- Consume telemetry from RabbitMQ.
- Batch inserts into PostgreSQL/TimescaleDB.
- Sync latest device telemetry from Redis to the database.
- Sync Codec 12 command state from Redis to the database.

Assessment:

- The batching and retry structure is useful.
- The service needs clearer contracts around RabbitMQ message shape and failure
  behavior.
- Retry/drop behavior exists, but a dead-letter queue policy should be decided
  before production data volume grows.

Current priorities:

- Document the RabbitMQ payload contract.
- Add malformed message handling tests.
- Clarify idempotency and duplicate telemetry behavior.
- Decide whether failed batches should move to a DLQ instead of being dropped
  after retries.
- Document Redis-to-database sync behavior for latest telemetry and Codec 12
  commands.

### `socketio.gateway.node.ts`

This service is the realtime delivery layer.

Responsibilities:

- Subscribe to Redis Pub/Sub channel `teltonika:live`.
- Parse live telemetry payloads.
- Validate usable `device_id`.
- Emit `live-update` events to device-specific Socket.IO rooms.

Assessment:

- The service is intentionally narrow, which is good.
- Live Redis messages now use plain JSON.
- A legacy base64 JSON fallback remains in place for mixed-version rollout.
- Message shape validation should eventually be stronger than checking
  `device_id` only.

Current priorities:

- Document Socket.IO room naming and event payloads.
- Add validation for malformed Redis messages.
- Decide whether Socket.IO joins need JWT and permission enforcement.
- Add small forwarding tests for plain JSON, legacy base64 JSON, malformed
  payloads, and missing device IDs.

### `web.backend.node.ts`

This is the main REST API service.

Responsibilities:

- Authentication and JWT handling.
- Access profile API.
- Device APIs.
- Asset APIs.
- Organisation APIs.
- User APIs.
- Group APIs.
- Teltonika Codec 12 command creation.
- Validation with Zod.
- Database access through Prisma.

Assessment:

- This service is the main contract boundary for the frontend.
- It should be improved after ingest and persistence contracts stabilize.
- Permissions and response shapes should be reviewed together with frontend
  route guards and UI behavior.

Current priorities:

- Document public REST endpoints and response shapes.
- Confirm Zod validation matches database constraints and frontend forms.
- Review backend authorization as the final security layer.
- Align asset, device, organisation, group, user, and access-profile contracts.
- Clarify the full Codec 12 command flow from API request to Redis to parser to
  database sync.

### `web.frontend.vue`

This is the operational dashboard and tracking UI.

Responsibilities:

- Authenticate users.
- Load access profile data.
- Render map-first live tracking.
- Render devices, assets, organisations, groups, and users screens.
- Apply permission-aware route guards and UI visibility.
- Receive Socket.IO `live-update` events and update device state.

Assessment:

- This should stay an operational dashboard, not a marketing site.
- The frontend should be polished after backend contracts are stable.
- Client-side permission checks are useful for UX, but backend services must
  remain authoritative for security.

Current priorities:

- Review map live-update behavior.
- Review asset/device linking workflows.
- Review loading, empty, and error states.
- Ensure route guards and sidebar/action visibility match backend permissions.
- Add UI tests only after the key flows stabilize.

### `file.server.go`

This service handles file and image workflows.

Responsibilities:

- Upload images for entities such as assets.
- Delete images.
- List images by entity type and entity ID.
- Store uploaded files under the configured upload volume.

Assessment:

- This service is relatively independent from the telemetry pipeline.
- It can be improved separately once asset image workflows become a priority.

Current priorities:

- Document image API routes and payloads.
- Confirm auth and authorization behavior.
- Confirm file storage paths, cleanup behavior, and failure handling.
- Add focused tests around upload/delete/list workflows when the API stabilizes.

### `computation.server.go`

This service is not production-shaped yet.

Current observed state:

- It has a Go module and service-like folder structure.
- Its current `main.go` connects to the database, fetches one hardcoded
  telemetry record, and prints JSON.

Assessment:

- Treat this as prototype code, not a deployed microservice yet.
- Do not add it to production deployment until it has one concrete
  responsibility.

Current priorities:

- Decide the first useful computation.
- Decide input source:
  database query, RabbitMQ stream, Redis state, or scheduled batch.
- Decide output destination:
  database table, Redis cache, API response, or generated report.
- Build the smallest useful computation first.

## Infrastructure And Data Flow

### PostgreSQL / TimescaleDB

PostgreSQL stores durable application state and telemetry. TimescaleDB is used
for telemetry time-series behavior.

Important areas:

- Organisations.
- Assets.
- Devices.
- Telemetry.
- Users, roles, permissions, groups, and access relationships.
- Teltonika Codec 12 command records.

Telemetry is the highest-volume durable data. Retention, compression,
partitioning, and query patterns should drive future analytics decisions.

### Redis

Redis is used for multiple roles:

- Shared device metadata cache.
- Shared organisation metadata cache.
- Live telemetry Pub/Sub.
- Latest telemetry state.
- Codec 12 command lifecycle state.

Because Redis is both cache and workflow state, Redis key contracts should stay
documented and stable.

### RabbitMQ

RabbitMQ moves parsed telemetry from `teltonika.parser.go` to
`telemetry.db.writer.node.ts`.

The main missing production decision is failure policy:

- retry count,
- dead-letter queue,
- malformed payload handling,
- duplicate/idempotency behavior.

### Docker Compose

The current compose file includes:

- PostgreSQL/TimescaleDB.
- Redis.
- RabbitMQ.
- `web.backend.node.ts`.
- `telemetry.db.writer.node.ts`.
- `socketio.gateway.node.ts`.
- `teltonika.parser.go`.
- `file.server.go`.

The compose file does not currently include:

- `web.frontend.vue`.
- `computation.server.go`.

That is reasonable for `computation.server.go` because it is still prototype
work. The frontend deployment path should be documented separately because it
uses the Vue build plus Go frontend server/proxy setup.

## Important Gaps

- Parser RabbitMQ publishing should be hardened against unavailable producer or
  channel state.
- Parser tests need a clean split between normal unit tests and Redis-dependent
  integration tests.
- Writer needs documented payload contracts and clearer failure policy.
- Gateway needs explicit Socket.IO auth/room authorization decisions.
- Backend and frontend permission contracts need to be reviewed together.
- Frontend polish should wait until API and realtime contracts are stable.
- `computation.server.go` needs a concrete first responsibility before it is
  treated as a real service.

## Recommended Next Order

1. Finish `teltonika.parser.go` hardening.
2. Tighten `telemetry.db.writer.node.ts` contracts and failure handling.
3. Lock down realtime contracts in `socketio.gateway.node.ts`.
4. Stabilize REST API contracts in `web.backend.node.ts`.
5. Polish `web.frontend.vue` workflows against stable backend contracts.
6. Define and build the first real `computation.server.go` responsibility.

## Practical Priority

Start with the parser.

The parser is the ingestion edge and controls downstream data quality. Once the
parser is reliable and its Redis/RabbitMQ contracts are stable, the writer,
gateway, API, and frontend can be improved with less rework.
