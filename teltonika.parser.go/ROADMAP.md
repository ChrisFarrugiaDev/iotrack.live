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

## Recommended Work

- [ ] Harden RabbitMQ publishing when the producer is not connected.
  - `SendDirectMessage` currently assumes `p.channel` is ready.
  - If RabbitMQ is unavailable while TCP traffic arrives, publishing can fail
    badly.
  - Keep the fix small: guard nil channel, log clearly, and return without
    panic.

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

## Validation Notes

- `GOCACHE=/tmp/gocache go test ./internal/...` passes.
- `GOCACHE=/tmp/gocache go build -o /tmp/teltonika-parser-analysis
  ./cmd/parser` builds, with the existing read-only module download cache
  warning.
- `GOCACHE=/tmp/gocache go test ./...` fails at
  `cmd/parser.Test_initializeCache` because Redis access is not available by
  default.
