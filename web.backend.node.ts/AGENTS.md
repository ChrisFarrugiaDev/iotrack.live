# Codex Instructions for `web.backend.node.ts`

Use this file as the primary context when working inside the REST API service.

## Before Editing

- Read `SPEC.md` before changing routes, auth, permissions, Redis keys, Prisma
  models, access-profile shape, or cross-service behavior.
- Read `ROADMAP.md` for current backend follow-up work.
- Read `BACKEND_ANALYSIS.md` only when you need deeper architecture notes,
  risks, or priority context.
- Keep changes local to the affected router, controller, model, schema, or
  middleware.
- Do not load frontend or broad project docs unless changing response shapes,
  permissions, access-profile, or another shared contract.

## How This Service Fits the Repo

- Owns REST APIs, authentication, permission checks, validation, Prisma access,
  access-profile hydration, and command creation.
- `../web.frontend.vue` consumes this service through `/api/*` and depends on
  stable response shapes.
- `../teltonika.parser.go` reads Codec 12 pending-command Redis queues created
  by this service.
- `../telemetry.db.writer.node.ts` persists telemetry and syncs command status
  that backend APIs later read.
- `../file.server.go` owns `/img/` file/image behavior used by backend/frontend
  workflows.
- Read `../docs/PERMISSIONS.md` only when changing permission keys,
  authorization behavior, or access-profile shape.

## Project Structure

- `src/server.ts` starts the service.
- `src/App.ts` creates Fastify, registers middleware/routes, and shuts down
  Redis/Prisma.
- `src/api/routers/` defines route groups.
- `src/api/controllers/` handles request flow.
- `src/api/schemas/` contains Zod schemas.
- `src/api/middleware/` contains auth, permission, and validation middleware.
- `src/models/` wraps Prisma calls.
- `src/config/` owns env, Prisma, and Redis clients.

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
- Prefer direct controller flow: validate, authorize, load data, perform the change, return an `ApiResponse`.
- Keep Zod schemas near route boundaries.
- Use explicit Redis prefixes at call sites for cross-service contracts, such as `iotrack.live:` or `teltonika.parser.go:`.
- Preserve JSON-safe ID conversion with existing BigInt patterns.

## Verification

Run from this service:

```sh
npm run build
```

There is no dedicated test suite yet. Future tests should focus on auth,
permissions, access-profile shape, scoped lists, and Codec 12 command creation.

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
