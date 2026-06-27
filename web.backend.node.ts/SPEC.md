# web.backend.node.ts Service Spec

## Purpose

`web.backend.node.ts` is the main REST API for `iotrack.live`.

It provides authenticated API access for the frontend and coordinates app data
stored in PostgreSQL and Redis.

## Responsibilities

- Authenticate users and issue JWTs.
- Validate JWTs and token versions.
- Build the authenticated user's access profile.
- Enforce backend authorization for protected routes.
- Manage devices, assets, organisations, groups, and users.
- Queue Teltonika Codec 12 commands for the parser.
- Keep Redis cache usage aligned with the rest of the platform.

The backend is the final authority for security and validation. Frontend route
guards and UI visibility are only user-experience helpers.

## Platform Context

This service is part of the larger `iotrack.live` microservice system:

- `../web.frontend.vue` consumes `/api/*` and depends on stable response shapes.
- `../file.server.go` handles image/file upload, list, and delete behavior.
- `../socketio.gateway.node.ts` handles live telemetry delivery through
  Socket.IO.
- `../teltonika.parser.go` reads Codec 12 pending-command lists written by this
  service under the `teltonika.parser.go:` Redis prefix.
- `../telemetry.db.writer.node.ts` persists telemetry and syncs Codec 12 command
  status from Redis back to PostgreSQL.
- `../computation.server.go` is early-stage and should not be treated as a
  stable dependency yet.

## Runtime Architecture

Startup flow:

1. `src/server.ts` imports env config.
2. `src/App.ts` creates a Fastify instance.
3. CORS middleware is registered.
4. Route groups are registered under `/api`.
5. The server listens on `HTTP_PORT`.
6. Graceful shutdown closes Fastify, Redis, and Prisma.

Main route groups:

- `/api/auth`
- `/api/access-profile`
- `/api/device`
- `/api/asset`
- `/api/user`
- `/api/organisation`
- `/api/group`
- `/api/teltonika`

## Data And Cache

PostgreSQL access uses Prisma with schemas:

- `app`
- `teltonika`

Redis is used for:

- JWT token-version cache.
- Permission and permission-key cache.
- Shared app metadata under the `iotrack.live:` prefix.
- Codec 12 pending-command queues under the `teltonika.parser.go:` prefix.

When changing Redis usage, keep the owner service and prefix explicit.

## API Shape

Responses should use the existing `ApiResponse` style:

```ts
{
  success: boolean;
  message: string;
  data?: unknown;
  error?: {
    code: string;
    details?: Record<string, any>;
    error?: any;
  };
}
```

Keep response shape changes coordinated with `../web.frontend.vue`.

## Auth And Permissions

Auth flow:

- Login verifies email/password.
- A JWT is issued with user ID, role ID, active organisation ID, and token
  version.
- Auth middleware verifies the JWT.
- Token version is checked through Redis/DB.
- Auth context is attached to `request`.
- Permission keys are loaded for downstream route checks.

Permission checks must happen on the backend. Root role behavior and permission
keys should stay explicit.

## Access Profile

`/api/access-profile` is the frontend hydration endpoint.

It should provide:

- user identity,
- active organisation,
- organisation scope,
- accessible assets,
- accessible devices,
- settings,
- permissions,
- groups,
- role/permission metadata needed by the UI.

This payload is frontend-critical. Keep it readable and document any shape
change before changing broad frontend behavior.

## Codec 12 Command Flow

The Teltonika command endpoint creates command records and pushes them into
Redis for `teltonika.parser.go`.

Expected cross-service flow:

1. API receives command request.
2. API writes command rows to PostgreSQL.
3. API pushes commands to
   `teltonika.parser.go:codec12:pending-commands:<imei>`.
4. Parser sends commands to connected devices.
5. Parser writes command result state to Redis.
6. `telemetry.db.writer.node.ts` syncs command status back to PostgreSQL.

This route is sensitive because it can send commands to physical devices. It
should require auth, validation, and a command-specific permission.

## Coding Expectations

- Keep route/controller flow readable and step by step.
- Prefer small local changes over broad refactors.
- Use Zod for route-boundary validation.
- Use existing model helpers before adding new data-access patterns.
- Preserve BigInt-to-string conversion before returning Prisma rows.
- Add short comments only where they clarify intent or service contracts.

## Verification

Run:

```sh
npm run build
```

There is no dedicated test suite yet. Future tests should focus on:

- auth and token-version behavior,
- permission denial,
- access-profile shape,
- scoped list endpoints,
- Codec 12 command creation and Redis queue writes.
