# Codex Instructions for `initdb-scripts`

Use this file when changing database schema, seed data, views, or setup SQL.

## Before Editing

- Treat SQL changes as cross-service contract changes.
- Inspect the service that reads or writes the affected tables before changing
  schema, field names, seed IDs, or default values.
- Do not change permission IDs, role IDs, Redis-related seed assumptions, or
  foreign-key behavior without checking consumers.

## Context

These scripts initialize PostgreSQL / TimescaleDB state for the platform.

Important consumers:

- `web.backend.node.ts` uses Prisma against the `app` and `teltonika` schemas.
- `telemetry.db.writer.node.ts` writes telemetry and syncs latest state.
- `teltonika.parser.go` reads device and organisation metadata and writes
  command / telemetry-related state through downstream services.
- `file.server.go` stores image metadata.

## Permission Changes

- Permission and role setup is in `05-tables.sql`.
- The current frontend/backend permission contract is documented in
  `../docs/PERMISSIONS.md`.
- When adding a permission key, update the backend checks, frontend UI behavior,
  role defaults, and relevant docs in the same change.

## Coding Guidelines

### Core Approach
- Work incrementally. One schema change at a time; validate consumer impact before moving on.
- Be simple. Don't add columns, tables, or constraints speculatively.

### SQL Style
- Use clear, consistent naming: snake_case for tables and columns.
- Add comments only to explain non-obvious constraints, seed assumptions, or cross-service contracts.
- Keep seed data minimal and stable; avoid hardcoding values that consumers may need to change.

### Debugging
- Identify root cause BEFORE fixing. Check consumer code (Prisma models, Go models) before changing schema.
- Don't apply workarounds to schema — fix the root contract instead.

## Verification

For schema changes, run the owning service build or tests:

- Backend Prisma/API changes: `cd ../web.backend.node.ts && npm run build`
- Writer Prisma changes: `cd ../telemetry.db.writer.node.ts && npm run build`
- Go service model changes: run that service's `GOCACHE=/tmp/gocache go test ./...`

## Commit Style
- Do not add `Co-Authored-By` or AI co-author trailers to commits.
