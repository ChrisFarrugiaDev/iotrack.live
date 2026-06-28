# iotrack.live Roadmap

This roadmap gives the project-level order of work. Service-specific details
belong in each service `ROADMAP.md`, while cross-service contracts and analysis
belong in `docs/`.

## Current State

- `teltonika.parser.go` is the ingestion edge and remains the highest-priority
  reliability service.
- `telemetry.db.writer.node.ts` persists parser telemetry and still needs
  clearer failure-policy documentation.
- `web.backend.node.ts` is the REST security and API contract boundary.
- `web.frontend.vue` consumes backend contracts and applies permission-aware UI
  behavior.
- `docs/PERMISSIONS.md` now documents the current permission model across the
  database, backend, and frontend.

## Recommended Work

### Permissions And Access Control

Start with backend enforcement, then align the frontend.

- [ ] Secure the Codec 12 command route in `web.backend.node.ts`.
  - Add auth to `POST /api/teltonika/codec12/commands/:imei`.
  - Add request validation.
  - Add a command-specific permission, for example `device.command`.
  - Add the permission to `initdb-scripts/05-tables.sql`.

- [ ] Tighten backend permission checks.
  - Reuse `request.userPerms` from auth middleware where practical.
  - Review list endpoints for matching `*.view` checks and access scoping.
  - Keep backend authorization as the final security boundary.

- [ ] Align frontend permission UX in `web.frontend.vue`.
  - Hide `Groups` behind `group.view`.
  - Change the group create tab check from `device.create` to `group.create`.
  - Add route guard coverage for create and update routes.


Reference: `docs/PERMISSIONS.md`.

### Parser Reliability

`teltonika.parser.go` remains the highest-priority service because it owns
device ingestion and downstream data quality.

- [ ] Keep watching TCP packet-boundary behavior.
  - Only revisit this if real parser errors show partial or combined TCP reads.

Reference: `teltonika.parser.go/ROADMAP.md`.

### Writer Persistence

`telemetry.db.writer.node.ts` should make durable persistence behavior clear and
predictable.

- [ ] Document RabbitMQ telemetry payload contracts.
- [ ] Add malformed-message handling tests.
- [ ] Decide retry, drop, and dead-letter queue policy.
- [ ] Clarify idempotency and duplicate telemetry behavior.
- [ ] Document Redis-to-database sync for latest telemetry and Codec 12
  commands.

Reference: `telemetry.db.writer.node.ts/ROADMAP.md`.

### Realtime Delivery

`socketio.gateway.node.ts` should stay narrow and contract-focused.

- [ ] Document Socket.IO room naming and `live-update` payload shape.
- [ ] Add validation for malformed Redis messages.
- [ ] Decide whether Socket.IO room joins need JWT and permission enforcement.
- [ ] Keep Redis live channel behavior aligned with parser output.

### Backend API

`web.backend.node.ts` should stabilize as the main REST contract boundary.

- [ ] Document public REST endpoints and response shapes.
- [ ] Keep Zod validation aligned with database constraints and frontend forms.
- [ ] Keep access-profile shape stable and documented.
- [ ] Clarify Codec 12 command flow from API to Redis to parser to database
  sync.

Reference: `web.backend.node.ts/ROADMAP.md`.

### Frontend Workflows

`web.frontend.vue` should follow backend contracts and stay operational rather
than marketing-oriented.

- [ ] Review map live-update behavior.
- [ ] Review asset/device linking workflows.
- [ ] Improve loading, empty, and error states.
- [ ] Keep sidebar/action visibility aligned with backend permission keys.
- [ ] Add UI tests after key flows stabilize.

Reference: `web.frontend.vue/ROADMAP.md`.

### File And Image Workflows

`file.server.go` is relatively independent and can be improved when image
workflows become a priority.

- [ ] Document image API routes and payloads.
- [ ] Confirm auth and authorization behavior.
- [ ] Confirm file storage paths and cleanup behavior.
- [ ] Add focused upload, delete, and list tests.

### Computation Server

`computation.server.go` is still prototype work.

- [ ] Define the first useful computation before production-shaping the service.
- [ ] Decide input source: database, RabbitMQ, Redis, or scheduled batch.
- [ ] Decide output destination: database table, Redis cache, API response, or
  generated report.
- [ ] Build the smallest useful computation first.

## Completed

- [x] Add central permission documentation.
  - `docs/PERMISSIONS.md` explains the database, backend, frontend, and current
    permission gaps.

- [x] Add service roadmaps for permission follow-up work.
  - `web.backend.node.ts/ROADMAP.md` tracks backend permission and access-profile
    follow-ups.
  - `web.frontend.vue/ROADMAP.md` tracks frontend permission UI and route guard
    follow-ups.

## Documentation Notes

- Keep `docs/PROJECT_OVERVIEW.md` for service orientation.
- Keep `docs/PROJECT_ANALYSIS.md` for architecture analysis and priority order.
- Keep `docs/PERMISSIONS.md` as the permission model source of truth.
- Keep service `ROADMAP.md` files focused on local follow-up work.
