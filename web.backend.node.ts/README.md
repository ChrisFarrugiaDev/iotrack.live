# web.backend.node.ts

Fastify + TypeScript REST API for `iotrack.live`.

This service provides the main backend API used by the Vue frontend. It handles
authentication, access profiles, devices, assets, organisations, users, groups,
and Teltonika Codec 12 command creation.

## How It Fits

`web.backend.node.ts` is one service inside the larger `iotrack.live` platform:

- `web.frontend.vue` calls this service through `/api/*`.
- `file.server.go` owns image/file routes under `/img/`.
- `socketio.gateway.node.ts` owns realtime `/socket.io/` delivery.
- `teltonika.parser.go` ingests device TCP data and reads Codec 12 commands
  this service queues in Redis.
- `telemetry.db.writer.node.ts` persists telemetry and syncs Codec 12 command
  status back to PostgreSQL.
- `computation.server.go` is still being defined.

The backend is the authority for authentication, authorization, validation, and
REST response shapes. The frontend can hide UI by permission, but this service
must enforce access rules.

## Project Shape

- `src/server.ts` starts the service.
- `src/App.ts` builds the Fastify app and registers `/api`.
- `src/api/routers/` defines route groups.
- `src/api/controllers/` contains request handling.
- `src/api/schemas/` contains Zod validation.
- `src/api/middleware/` contains auth, permission, and validation middleware.
- `src/models/` wraps Prisma data access.
- `src/config/` contains env, Prisma, and Redis setup.
- `prisma/schema.prisma` maps PostgreSQL schemas.

Route groups:

- `/api/auth`
- `/api/access-profile`
- `/api/device`
- `/api/asset`
- `/api/user`
- `/api/organisation`
- `/api/group`
- `/api/teltonika`

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

Prisma helpers:

```sh
npm run prisma-pull
npm run prisma-generate
```

## Working Style

Keep code readable and direct. For route work, keep the flow easy to scan:
validate input, check auth/permission, load data, perform the action, return a
consistent response.

Read `SPEC.md` for the service contract and `BACKEND_ANALYSIS.md` for current
risks and next work.
