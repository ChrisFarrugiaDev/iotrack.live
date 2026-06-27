# Codex Instructions for `teltonika.parser.go`

This directory is a standalone Go module for the Teltonika TCP parser service.
When Codex is opened from this directory, treat this file and `SPEC.md` as the
main project context.

## Scope

- Main service entrypoint: `cmd/parser/main.go`
- Configuration/bootstrap: `cmd/parser/settings.go`
- TCP connection lifecycle: `internal/tcp`
- Teltonika protocol parsing: `internal/teltonika`
- Packet and message types: `internal/apptypes`
- Redis helpers: `internal/cache`
- RabbitMQ producer: `internal/rabbitmq`
- Database models and services: `internal/models`, `internal/services`

## How This Service Fits the Repo

`teltonika.parser.go` is the ingestion edge for the whole `iotrack.live`
platform. Teltonika devices connect here over TCP. This service parses IMEI
handshakes, Codec 8, Codec 8 Extended, and Codec 12 packets, then dispatches
data to Redis and RabbitMQ for the rest of the system.

Related services in the repo:

- `web.backend.node.ts` creates Codec 12 commands and pushes pending command
  records into Redis for this parser.
- `telemetry.db.writer.node.ts` consumes parser telemetry from RabbitMQ and
  syncs parser Redis state back to PostgreSQL.
- `socketio.gateway.node.ts` subscribes to parser Redis live messages and emits
  Socket.IO updates to frontend clients.
- `web.frontend.vue` displays device and asset state using REST data and live
  Socket.IO telemetry.
- `initdb-scripts` defines the PostgreSQL schemas/tables used by devices,
  telemetry, organisations, and Codec 12 commands.

## Working Rules

- Keep changes focused on this module unless the task explicitly crosses service
  boundaries.
- Do not edit `.env`, `.env.development`, encrypted `.gpg` files, or the built
  `teltonika-parser` binary unless explicitly asked.
- Prefer adding or updating focused tests near the package being changed.
- Preserve existing Redis key names, RabbitMQ routing keys, JSON field names,
  and Teltonika ACK/packet behavior unless the task is specifically to change a
  contract.
- When changing cross-service contracts, check the matching Node service before
  editing:
  - command API: `../web.backend.node.ts/src/api/controllers/teltonika.controller.ts`
  - telemetry writer: `../telemetry.db.writer.node.ts/src/rabbitmq/consumer.ts`
  - command sync writer:
    `../telemetry.db.writer.node.ts/src/services/update-teltonika-codec12-commands-from-redis.service.ts`
  - live gateway: `../socketio.gateway.node.ts/src/App.ts`

## VERY IMPORTANT
- Be simple. Approach tasks in a simple, incremental way.
- Work incrementally ALWAYS. Small, simple steps. Validate and check each increment before moving on.
- Use LATEST apis as of NOW

## MANDATORY Code Style
- Do not overengineer. Do not program defensively. Use exception managers only when needed.
- Identify root cause before fixing issues. Prove with evidence, then fix.
- Work incrementally with small steps. Validate each increment.
- Use latest library APIs.
- Favor clear, concise docstring comments. Be sparing with comments outside docstrings.
- Favor short modules, short methods and functions. Name things clearly.

## Important - debugging and fixing
- When troubleshooting problems, ALWAYS identify root cause BEFORE fixing
- PROVE THE PROBLEM FIRST — don't guess.
- Try one test at a time. Be methodical.
- Don't jump to conclusions. Don't apply workarounds.

## Coding Style

- Keep Go code very readable and step-by-step, especially in protocol parsing,
  TCP lifecycle, Redis/RabbitMQ state transitions, and startup/shutdown flows.
- Preserve and use visible separator comments for large sections, for example:
  `// ---------------------------------------------------------------------` and
  `// -------------------- Command Send/Retry Logic --------------------`.
- Use short comments to explain protocol intent, business intent, or non-obvious
  state transitions. Avoid comments that only repeat the code.
- Prefer small helper functions when a function has multiple clear phases, but
  keep the high-level phase comments at the call site so the flow remains easy
  to scan.
- Avoid dense or clever code when a straightforward sequence with clear names is
  easier to read and maintain.

## Useful Commands

Run from `teltonika.parser.go`:

```bash
GOCACHE=/tmp/gocache go test ./...
GOCACHE=/tmp/gocache go test ./cmd/parser
GOCACHE=/tmp/gocache go test ./internal/rabbitmq
GOCACHE=/tmp/gocache go test ./internal/tcp ./internal/teltonika ./internal/util
go build -o teltonika-parser ./cmd/parser
```

Redis integration tests are opt-in. Run them only when a local Redis test
instance is available:

```bash
RUN_REDIS_TESTS=1 GOCACHE=/tmp/gocache go test ./cmd/parser
```

From the repo root, the existing build target is:

```bash
make teltonika-parser-build
```

The Docker Compose service name is `teltonika-parser-go`.

## Implementation Notes

- Redis cache prefix for parser-owned keys is `teltonika.parser.go:`.
- Shared device and organisation hashes currently use the `iotrack.live:`
  prefix.
- RabbitMQ direct exchange is `teltonika`.
- Main telemetry routing key is `teltonika_telemetry`, bound to queue
  `telemetry`.
- Live Redis pub/sub channel is `teltonika:live`.
- Default TCP port is `5027` if `TCP_PORT` is not set.
- Default TCP timeout is `30` seconds if `TCP_TIMEOUT` is not set.
- Parser logs use the local Zap wrapper in `internal/logger`.

## Recent Implementation Updates

- RabbitMQ publishing now guards nil producers and unavailable channels before
  publishing from `SendDirectMessage` and `SendFanoutMessage`.
- Focused RabbitMQ tests cover nil producer and nil channel publish paths in
  `internal/rabbitmq/producer_test.go`.
- Redis cache initialization tests are gated behind `RUN_REDIS_TESTS=1` so
  normal parser tests do not require local Redis.
