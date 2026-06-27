# Teltonika Parser Roadmap

This file tracks recommended engineering work for `teltonika.parser.go`.
`SPEC.md` remains the source of truth for the service role, contracts, and
expected runtime behavior.

## Current State

- The service accepts Teltonika TCP connections, handles the IMEI handshake,
  parses Codec 8, Codec 8 Extended, and Codec 12 packets, then forwards state to
  Redis, RabbitMQ, and PostgreSQL-backed services.
- Startup initializes app state, Redis, RabbitMQ, PostgreSQL models, async Redis
  publishing, device and organisation syncs, cron jobs, and the TCP listener.
- The hot path is the TCP handler: handshake, codec dispatch, Codec 12 command
  lifecycle, telemetry publish, latest telemetry cache update, and live Redis
  publish.
- Telemetry currently leaves the parser through three paths: all telemetry goes
  to RabbitMQ for `telemetry.db.writer.node.ts`, latest telemetry snapshots are
  cached in Redis, and live updates are published through Redis pub/sub for the
  Socket.IO gateway.

## Recommended Work

- [ ] Make telemetry delivery contracts explicit.
  - RabbitMQ is the durable/history path.
  - Redis latest-telemetry keys are the fast current-state path.
  - Redis pub/sub is the live UI path and is allowed to miss messages because
    the latest snapshot can be recovered from Redis.
  - Consider adding `schema_version` to telemetry payloads and changing
    RabbitMQ message content type from `text/plain` to `application/json`.
  - Ensure the DB writer is idempotent for duplicate or retried telemetry,
    ideally using a stable device/timestamp/event identity.

- [ ] Make Redis-dependent tests explicit.
  - `go test ./...` currently fails because `Test_initializeCache` expects local
    Redis at `127.0.0.1:16379`.
  - Gate integration tests behind an environment variable such as
    `RUN_REDIS_TESTS=1`.
  - Normal local verification should not require Redis credentials.

- [ ] Add focused parser tests with real Teltonika examples.
  - Add tests for IMEI parsing, Codec 8, Codec 8 Extended, and Codec 12
    response.
  - Use small real hex packet fixtures from Teltonika docs.
  - Keep tests close to `internal/teltonika`.

- [ ] Review latest telemetry locking.
  - `LastTsMap` and `LastTelemetryMap` are touched from packet handlers and cron
    flush code.
  - Check with the race detector after focused tests exist.
  - Only change locking if a race is confirmed or the fix stays simple.

- [ ] Optional: improve TCP data packet reading.
  - Keep current IMEI handling as-is.
  - Only revisit if parser errors appear from partial or combined TCP reads.
  - Keep any future change small, readable, and local to `server.go`.

## Completed

- [x] Fix live Redis payload encoding.
  - `internal/tcp/handler.go` now publishes existing JSON bytes directly instead
    of wrapping them with `json.Marshal(msg)`.

- [x] Harden RabbitMQ publishing when the producer is not connected.
  - `SendDirectMessage` and `SendFanoutMessage` now guard nil producers and
    unavailable channels before publishing.
  - Added focused tests for nil producer and nil channel publish paths in
    `internal/rabbitmq/producer_test.go`.
  - Next reliability pass should decide whether to use publisher confirms,
    local retry/backoff, or a dead-letter/failure path before treating telemetry
    as safely handed off.

## Validation Notes

- `GOCACHE=/tmp/gocache go test ./internal/...` passes.
- `GOCACHE=/tmp/gocache go test ./internal/rabbitmq` passes.
- `GOCACHE=/tmp/gocache go build -o /tmp/teltonika-parser-analysis
  ./cmd/parser` builds, with the existing read-only module download cache
  warning.
- `GOCACHE=/tmp/gocache go test ./...` fails at
  `cmd/parser.Test_initializeCache` because Redis access is not available by
  default.
