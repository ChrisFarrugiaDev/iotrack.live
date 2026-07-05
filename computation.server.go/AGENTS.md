# Codex Instructions for `computation.server.go`

Use this file as the primary context when working inside this service.

## Before Editing

- Treat this service as prototype work.
- Do not assume a production responsibility until the user defines the first
  concrete computation need.
- Keep changes small and exploratory unless a clear service responsibility has
  been agreed.

## Service Context

This service is intended for future computations, analytics, or reports, but it
does not yet have a stable production role.

Possible future inputs:

- PostgreSQL / TimescaleDB queries.
- Redis state.
- RabbitMQ streams.
- Scheduled batch jobs.

Possible future outputs:

- Database rows.
- Redis cache entries.
- Backend API responses.
- Generated reports.

## Project Structure

- `cmd/app/main.go` starts the current prototype.
- `cmd/app/settings.go` loads environment settings.
- `internal/appcore/` contains current app flow.
- `internal/db/` owns database connection setup.
- `internal/models/` contains prototype models.

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
GOCACHE=/tmp/gocache go test ./...
```

Do not add this service to production assumptions without updating root docs.

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
