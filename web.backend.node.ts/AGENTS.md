# Codex Instructions for `web.backend.node.ts`

## Before Editing

- Read `SPEC.md` before changing routes, auth, permissions, Redis keys, Prisma
  models, access-profile shape, or cross-service behavior.
- Check `BACKEND_ANALYSIS.md` for current risks and recommended next work.
- Keep changes local to the affected router, controller, model, schema, or
  middleware.
- Do not change response shapes without checking frontend usage in
  `../web.frontend.vue`.

## Service Context

This service is the main REST API for `iotrack.live`.

- `../web.frontend.vue` consumes this service through `/api/*`.
- `../socketio.gateway.node.ts` owns realtime Socket.IO delivery, not REST API
  behavior.
- `../file.server.go` owns `/img/` image/file behavior.
- `../teltonika.parser.go` consumes Codec 12 commands queued by this service in
  Redis.
- `../telemetry.db.writer.node.ts` syncs telemetry and Codec 12 command state
  back to PostgreSQL.
- `../computation.server.go` is still early-stage and should not be assumed as
  a stable backend dependency.

## Project Structure

- `src/server.ts` loads config and starts the app.
- `src/App.ts` creates the Fastify server, registers middleware/routes, and
  shuts down Redis/Prisma.
- `src/api/routers/` defines route groups.
- `src/api/controllers/` handles request flow.
- `src/api/schemas/` contains Zod schemas.
- `src/api/middleware/` contains auth, permission, and validation middleware.
- `src/models/` wraps Prisma calls.
- `src/config/` owns env, Prisma, and Redis clients.
- `src/utils/` contains logger, Redis helpers, BigInt conversion, and small
  shared helpers.
- `prisma/schema.prisma` maps the `app` and `teltonika` schemas.

## Commands

```sh
npm install
npm run build
npm run dev
```

- `npm run build` runs TypeScript compilation.
- `npm run dev` starts the service with `ts-node`.
- Prisma helpers:
  - `npm run prisma-pull`
  - `npm run prisma-generate`

## Coding Style

- Prioritize readability and understanding over clever abstraction.
- Prefer direct controller flow: validate, authorize, load data, perform the
  change, return an `ApiResponse`.
- Use clear names and small local helpers only when they remove real
  duplication.
- Keep comments short and useful. Explain intent, service contracts, or
  non-obvious permission/Redis behavior.
- Keep Zod schemas near route boundaries.
- Use explicit Redis prefixes at call sites when touching another service's
  contract, such as `iotrack.live:` or `teltonika.parser.go:`.
- Preserve JSON-safe IDs by using existing BigInt conversion patterns.

## Verification

Run at least:

```sh
npm run build
```

There is no dedicated test suite yet. If adding tests later, keep them focused
around auth, permissions, access-profile shape, scoped list behavior, and Codec
12 command creation.

## Commit Guidelines

Do not add a `Co-Authored-By: Claude ...` trailer (or any AI co-author) to commits. Commits should list only the human author.
