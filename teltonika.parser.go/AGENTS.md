# Codex Instructions for `teltonika.parser.go`

Use this file as the primary context when working inside the Teltonika TCP parser
service. `SPEC.md` remains the source of truth for service behavior and
contracts.

## Before Editing

- Read `SPEC.md` before changing parsing, Redis/RabbitMQ contracts, Codec 12
  command lifecycle, latest telemetry state, or startup behavior.
- Read `ROADMAP.md` for current parser follow-up work.
- Keep changes inside this Go module unless the task explicitly crosses service
  boundaries.
- Do not edit `.env`, `.env.development`, encrypted `.gpg` files, or the built
  `teltonika-parser` binary unless explicitly asked.

## Protocol Reference

Load the `teltonika-codec` skill only when working on protocol parsing, codec
packet types, CRC, ACK behavior, Codec 12 commands, or `parse_*.go` files.

- Claude Code: invoke the `teltonika-codec` skill via the Skill tool.
- Codex / other agents: read `.agents/skills/teltonika-codec/SKILL.md` and its
  referenced files only when the protocol task needs them.

## How This Service Fits the Repo

- Receives Teltonika TCP traffic and publishes parsed telemetry to RabbitMQ and
  Redis.
- `../web.backend.node.ts` creates Codec 12 commands that this parser sends to
  devices.
- `../telemetry.db.writer.node.ts` persists parser telemetry and syncs parser
  Redis command/latest state.
- `../socketio.gateway.node.ts` forwards parser Redis live telemetry to
  frontend clients.
- Check `../initdb-scripts` only when changing database-backed device,
  organisation, telemetry, or command assumptions.

## Project Structure

- `cmd/parser/main.go` starts the service.
- `cmd/parser/settings.go` handles configuration/bootstrap.
- `internal/tcp` owns connection lifecycle and dispatch.
- `internal/teltonika` owns protocol parsing.
- `internal/apptypes` owns packet and message types.
- `internal/cache` owns Redis helpers.
- `internal/rabbitmq` owns RabbitMQ publishing.
- `internal/models` and `internal/services` own database-facing behavior.

## Contract Safety

- Preserve Redis key names, RabbitMQ routing keys, JSON field names, and
  Teltonika ACK/packet behavior unless the task is specifically to change a
  contract.
- Parser-owned Redis prefix: `teltonika.parser.go:`.
- Shared app Redis prefix: `iotrack.live:`.
- RabbitMQ direct exchange: `teltonika`.
- Main telemetry routing key: `teltonika_telemetry`, queue `telemetry`.
- Live Redis pub/sub channel: `teltonika:live`.

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
- Apply step-by-step style especially in protocol parsing, TCP lifecycle, Redis/RabbitMQ state transitions, and startup/shutdown flows.
- Preserve visible separator comments where the code already uses them.
- When debugging parser or protocol issues, prefer focused tests near the affected package.

## Verification

Run focused checks from this service:

```sh
GOCACHE=/tmp/gocache go test ./internal/tcp ./internal/teltonika ./internal/util
GOCACHE=/tmp/gocache go test ./internal/rabbitmq
GOCACHE=/tmp/gocache go test ./cmd/parser
GOCACHE=/tmp/gocache go test ./...
```

Redis integration tests are opt-in:

```sh
RUN_REDIS_TESTS=1 GOCACHE=/tmp/gocache go test ./cmd/parser
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
