# Codex Instructions for `telemetry.db.writer.node.ts`

Use this file as the primary context when working inside this service.

## Before Editing

- Read `ROADMAP.md` for current writer follow-up work.
- Check producer/consumer contracts before changing RabbitMQ payloads, Redis
  keys, Prisma models, or database write behavior.
- Keep changes local to the writer unless the user asks for a cross-service
  contract change.

## How This Service Fits the Repo

- Consumes parser telemetry from RabbitMQ and writes durable telemetry history
  to PostgreSQL / TimescaleDB.
- Reads parser Redis latest-telemetry state and syncs it to device rows.
- Reads parser Redis Codec 12 command-result state and syncs command status to
  PostgreSQL.
- `../web.backend.node.ts` and `../web.frontend.vue` consume the persisted state
  through REST/API workflows, not directly from this service.
- Check `../teltonika.parser.go` before changing RabbitMQ payloads or Redis sync
  keys.

## Project Structure

- `src/server.ts` starts the service.
- `src/App.ts` wires RabbitMQ, Redis, Prisma, and cron sync jobs.
- `src/rabbitmq/consumer.ts` consumes telemetry batches.
- `src/services/` contains Redis-to-database sync jobs.
- `src/models/` wraps Prisma writes.
- `src/config/` owns env, Prisma, and Redis clients.

## Contract Safety

- Do not change RabbitMQ exchange, routing key, queue, or telemetry message
  shape without checking `../teltonika.parser.go`.
- Do not change Redis latest telemetry or Codec 12 command sync keys without
  checking parser and backend usage.
- Keep telemetry writes readable and failure behavior explicit.

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

## Verification

Run from this service:

```sh
npm run build
```

There is no dedicated test suite yet. If tests are added, focus on malformed
messages, retry/drop behavior, duplicate handling, and Redis sync jobs.

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
