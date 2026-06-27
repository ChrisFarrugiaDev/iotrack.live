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

- [ ] Review telemetry writer idempotency.
  - `../telemetry.db.writer.node.ts` currently bulk inserts RabbitMQ telemetry.
  - Decide whether duplicate or retried telemetry should be ignored using a
    stable device/timestamp/event identity.
  - Consider adding `schema_version` to telemetry payloads only as a coordinated
    parser and writer change.

- [ ] Low priority - parked: watch TCP packet boundary handling.
  - Teltonika packets include `Data Field Length`, so packet boundaries can be
    handled if real device logs prove the current read loop needs it.
  - Do not change current IMEI or data packet reading logic unless parser errors
    show partial or combined TCP reads.
  - If needed later, keep any future change small, readable, and local to
    `server.go`.

## Completed

- [x] Make telemetry delivery contracts explicit.
  - `SPEC.md` now documents RabbitMQ as the durable/history path, Redis latest
    telemetry as the current-state path, and Redis pub/sub as best-effort live
    UI delivery.
  - RabbitMQ publish metadata now uses content type `application/json`.
  - Telemetry JSON field names, routing keys, exchanges, queues, Redis keys, and
    pub/sub channels were left unchanged.

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

- [x] Make Redis-dependent tests explicit.
  - `Test_initializeCache` now skips unless `RUN_REDIS_TESTS=1` is set.
  - Normal parser package tests no longer require Redis at `127.0.0.1:16379`.
  - Redis integration verification remains available with
    `RUN_REDIS_TESTS=1 GOCACHE=/tmp/gocache go test ./cmd/parser`.

- [x] Add focused parser tests with real Teltonika examples.
  - Added tests for IMEI parsing, Codec 8, Codec 8 Extended, and Codec 12
    response using Teltonika wiki hex packet examples.
  - Tests live in `internal/teltonika/parser_test.go`.

- [x] Review latest telemetry locking.
  - `LastTsMap` now uses a dedicated lock around timestamp map reads and writes.
  - `FlushLastTelemetry` snapshots latest telemetry while holding
    `LatestTelemetryLock`, then writes the snapshot to Redis outside the lock.
  - `FlatAvlRecord.DeepCopy` prevents the flushed snapshot from sharing the
    mutable `Elements` map with later telemetry updates.
  - Added focused tests for latest telemetry merge behavior and deep-copy
    behavior.

## Validation Notes

- `GOCACHE=/tmp/gocache go test ./...` passes.
- `GOCACHE=/tmp/gocache go test ./internal/...` passes.
- `GOCACHE=/tmp/gocache go test ./cmd/parser` passes.
- `GOCACHE=/tmp/gocache go test -race ./internal/services ./internal/apptypes
  ./internal/tcp ./internal/teltonika ./cmd/parser` passes.
- `GOCACHE=/tmp/gocache go test ./internal/services ./internal/apptypes` passes.
- `GOCACHE=/tmp/gocache go test ./internal/rabbitmq` passes.
- `GOCACHE=/tmp/gocache go test ./internal/teltonika` passes.
- `GOCACHE=/tmp/gocache go build -o /tmp/teltonika-parser-analysis
  ./cmd/parser` builds, with the existing read-only module download cache
  warning.
- Redis integration tests require `RUN_REDIS_TESTS=1` and a local Redis test
  instance.
