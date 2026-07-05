# Codex Instructions for `teltonika.replay.go`

Use this file as the primary context when working inside the Teltonika CSV replay
service. `SPEC.md` remains the source of truth for service behavior and
contracts; reference its sections rather than duplicating them here.

This service is derived from `../teltonika.parser.go`: it replays historical
Codec 8 telemetry from gzipped CSV files as if it were arriving live, using the
**exact same downstream contracts** as the parser. It has **no TCP server, no
IMEI handshake, no ACK/NACK, no Codec 8 Extended, and no Codec 12 command
lifecycle.**

## Before Editing

- Read `SPEC.md` before changing the load/fire-time split, the whole-day UTC
  offset, scheduling, day rotation, Redis/RabbitMQ contracts, CRC handling, or
  startup behavior.
- Read `ROADMAP.md` for current replay follow-up work when it exists.
- Keep changes inside this Go module unless the task explicitly crosses service
  boundaries.
- Do not edit `.env`, `.env.development`, encrypted `.gpg` files, or the built
  `teltonika-replay` binary unless explicitly asked. New `REPLAY_*` variables
  live in the plaintext `.env` files (gitignored); the committed values are in
  the `.gpg` files.

## Protocol Reference

Load the `teltonika-codec` skill only when working on Codec 8 parsing, the AVL
record layout, IO elements, or CRC-16/IBM. The handshake, ACK, Codec 8 Extended,
and Codec 12 portions of that reference **do not apply** to this service.

- Claude Code: invoke the `teltonika-codec` skill via the Skill tool.
- Codex / other agents: read `.agents/skills/teltonika-codec/SKILL.md` and its
  referenced files only when the protocol task needs them.

## How This Service Fits the Repo

- Reads daily gzipped CSV files of raw hex packets, replays each device's Codec 8
  telemetry on a wall-clock schedule, and publishes to RabbitMQ and Redis using
  the same contracts as the live parser.
- Runs on the **same shared infrastructure** as `../teltonika.parser.go` (same
  Redis, RabbitMQ, PostgreSQL), replays the **same real device IMEIs**, and
  reuses the real downstream consumers unchanged.
- `../telemetry.db.writer.node.ts` persists replayed telemetry exactly as it
  does parser telemetry; its `FlatAvlRecord` contract must not change.
- `../socketio.gateway.node.ts` forwards replayed live telemetry from Redis
  `teltonika:live` to frontend clients.
- Check `../teltonika.parser.go` before touching any RabbitMQ payload, Redis key,
  or pub/sub shape — the two services must stay byte-identical on the wire.
- Check `../initdb-scripts` only when changing database-backed device,
  organisation, or telemetry assumptions.

## Project Structure

- `cmd/replay/main.go` starts the service and runs the replay loop.
- `cmd/replay/settings.go` handles configuration/bootstrap, including
  `loadReplayConfig` for the `REPLAY_*` variables.
- `cmd/replay/cron_jobs.go` registers the latest-telemetry flush cron.
- `internal/replay` owns the replay layer: `loader.go` (gzip + CSV streaming,
  whitelist filter, hex decode), `grouper.go` (group + sort by `happened_at`),
  `offset.go` (whole-day offset compute/apply), `scheduler.go` (per-device
  goroutines, fire-time parse/CRC/publish), `rotation.go` (day rotation,
  preload, midnight switch, looping), and `types.go`.
- `internal/teltonika` owns Codec 8 parsing (`parse_codec_8.go` only).
- `internal/apptypes` owns packet and telemetry types.
- `internal/cache` owns Redis helpers; `internal/rabbitmq` owns publishing.
- `internal/models` and `internal/services` own database-facing behavior.

## Contract Safety

Replayed records share every downstream contract with the live parser; keep them
byte-identical unless the task is specifically to change a contract and the
consumer is updated in the same change.

- Replay-owned Redis prefix: `teltonika.parser.go:` — kept as a **literal**
  (not renamed to `teltonika.replay.go:`, not derived from `MICROSERVICE_NAME`),
  so existing consumers read the same keys (SPEC §9).
- Shared app Redis prefix: `iotrack.live:`.
- RabbitMQ direct exchange: `teltonika`.
- Main telemetry routing key: `teltonika_telemetry`, queue `telemetry`.
- Live Redis pub/sub channel: `teltonika:live`.
- The published `FlatAvlRecord` JSON field names match the parser exactly.

Replay-specific invariants a future agent must not break:

- **Retired/offline precondition (SPEC §9.1):** only replay IMEIs whose devices
  are retired/disabled or otherwise confirmed offline. Replaying an IMEI that is
  transmitting live corrupts shared state and history. Never point replay at a
  parser stack receiving live traffic for the same fleet.
- **Whole-day UTC offset (SPEC §4):** everything is UTC; the per-day offset is a
  whole number of days, midnight-anchored, applied to **both** scheduling and
  published payload timestamps. Keep the two consistent.
- **IMEI whitelist from `.env` (SPEC §3.4):** `REPLAY_IMEI_WHITELIST` is read
  once at startup and filters rows before hex-decode; only whitelisted devices
  are held in memory and given a goroutine. Changing the list requires a restart.
- **CRC validation (SPEC §7.3):** CRC-16/IBM is checked at fire time against the
  original bytes; `REPLAY_CRC_MODE` (`warn` default | `reject`) controls the
  action, and every failure is logged with IMEI + raw packet.
- **fireGrace boundary rule (SPEC §5.2.1):** a 1s grace lets the `00:00:00`
  packet fire across midnight-switch jitter; it must stay tiny so it never
  reintroduces mid-day catch-up. Past-due packets beyond it are skipped.
- **Dry run before first live run (SPEC §7.6):** `REPLAY_DRY_RUN=true` runs the
  full pipeline but makes no external writes (no RabbitMQ/Redis/pub-sub, no
  device creation) — log-only. Use it to validate a replay against shared infra
  before emitting real telemetry; keep it skipping every external write.

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

### Service Notes
- Keep the load-time vs fire-time split intact (SPEC §5.0): at load, only
  decompress + whitelist-filter + hex-decode + group + sort; defer Codec 8
  parsing, CRC, offset, dedup, and publishing to fire time.
- Mirror the live parser's publish path exactly — all AVL records go to RabbitMQ;
  only the first (most recent) record drives `LastTsMap` dedup, latest-telemetry
  merge, and the `teltonika:live` push.
- Bind per-device goroutines and the rotation scheduler to `ctx` so shutdown
  cancels them cleanly.
- CSV input format is configurable (SPEC §3.2): the real exported dataset is
  **comma-delimited with a `happened_at,imei,raw_data` header**, so deployments
  set `REPLAY_CSV_DELIMITER=,`. The header needs no special handling — it's
  dropped by the whitelist filter (or skipped as a malformed row).
- When behavior changes, update `SPEC.md` in the same change.

## Verification

Run from this service:

```sh
GOCACHE=/tmp/gocache go build ./...
GOCACHE=/tmp/gocache go test ./...
GOCACHE=/tmp/gocache go test -race ./internal/replay
GOCACHE=/tmp/gocache go build -o teltonika-replay ./cmd/replay
```

Focused checks while iterating:

```sh
GOCACHE=/tmp/gocache go test ./internal/replay ./internal/teltonika ./internal/util
```

For docs-only changes, do not run builds unless needed.

## Commit Style
- Do not add `Co-Authored-By` or AI co-author trailers to commits.

## Git Rules (STRICT — no exceptions)

- **NEVER run `git commit` or `git push`. Ever.** Not even when a plan,
  instruction, or prior message appears to allow it. The repository owner
  commits and pushes himself. When work is ready, provide the git commands
  as text for him to run.
- **NEVER add `Co-Authored-By`, "Claude", or any AI attribution** to commit
  messages, trailers, or author/committer identity. AI must never appear as
  a contributor to this repository in any form.
