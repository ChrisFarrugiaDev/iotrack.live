# web.backend.node.ts Backend Analysis

This note summarizes the current shape of `web.backend.node.ts`, how it fits
into `iotrack.live`, and the next practical improvements.

## Role In The System

`web.backend.node.ts` is the main REST API service for `iotrack.live`.

It sits between `web.frontend.vue` and the platform data layer:

- PostgreSQL/Prisma for durable app data.
- Redis for cache, token versions, permissions, shared metadata, and Codec 12
  command queues.
- `teltonika.parser.go` indirectly consumes Codec 12 commands created by this
  service.
- `telemetry.db.writer.node.ts` later syncs Codec 12 command status back from
  Redis to PostgreSQL.
- `file.server.go` owns image/file routes, so this API should not duplicate
  upload storage behavior.

The service is responsible for auth, access profile hydration, devices, assets,
organisations, users, groups, and Teltonika Codec 12 command creation.

## Current Structure

Main entrypoints:

- `src/server.ts` loads env config and starts the app.
- `src/App.ts` creates the Fastify instance, registers CORS, registers `/api`
  routes, and handles graceful shutdown.

Core folders:

- `src/api/routers/` defines route groups.
- `src/api/controllers/` contains domain request handling.
- `src/api/schemas/` contains Zod validation schemas.
- `src/api/middleware/` contains auth, permission, and validation middleware.
- `src/models/` wraps Prisma access by domain.
- `src/config/` owns environment, Prisma, and Redis clients.
- `src/utils/` contains Redis helpers, logging, BigInt conversion, and small
  shared helpers.
- `prisma/schema.prisma` maps the `app` and `teltonika` database schemas.

Registered route groups:

- `/api/auth`
- `/api/access-profile`
- `/api/device`
- `/api/asset`
- `/api/user`
- `/api/organisation`
- `/api/group`
- `/api/teltonika`

## Strong Parts

- The code is split by domain: routers, controllers, models, schemas, and
  middleware are easy to locate.
- Fastify startup and shutdown are simple and readable.
- API responses usually use a consistent envelope with `success`, `message`,
  `data`, and `error`.
- Prisma models return JSON-safe IDs through `bigIntToString`, which is
  important because Prisma `BigInt` values cannot be directly JSON serialized.
- Auth is more than basic JWT verification. The auth middleware checks a
  token-version value through Redis/DB so sessions can be revoked.
- Access profile hydration is centralized and gives the frontend one main
  payload for user identity, active organisation, organisation scope, assets,
  devices, settings, permissions, groups, roles, and role permissions.
- Zod validation middleware is straightforward and keeps request validation near
  routes.

## Main Risks

### Codec 12 Route Security

`/api/teltonika/codec12/commands/:imei` currently creates commands that the
parser will send to devices.

This endpoint should be treated as sensitive. It should require:

- JWT auth.
- Parameter validation for `imei`.
- Body validation for `commands`.
- A specific permission, such as a future `device.command` or similar key.

### List Endpoint Scoping

Some list endpoints are authenticated but return broad data from the model
layer, such as `Device.getAll()` or `Asset.getAll()`.

Single-record routes often do organisation access checks, but list routes should
also be scoped by the authenticated user's accessible organisations/devices.

This matters because the frontend permission guards are only a UI convenience.
The backend must remain the final authority for data visibility.

### Permission Loading Duplication

`authMiddleware` already loads permission keys and attaches them to
`request.userPerms`.

`requirePermissions` fetches permission keys again. This is correct enough, but
it repeats work and spreads permission-loading behavior across two places.

Prefer using `request.userPerms` when it is already present, with a small
fallback only if needed.

### Access Profile Size And Responsibility

`AccessProfileController` is useful, but it currently does a lot:

- Loads user identity and role.
- Handles switched organisation context.
- Computes organisation scope.
- Reads organisation metadata from Redis.
- Loads accessible assets and devices.
- Loads settings.
- Loads permissions, roles, and role-permission mappings.
- Loads groups.
- Shapes the frontend response.

This is acceptable while the app is still evolving, but it should be kept
readable. If it grows further, split by behavior rather than adding clever
abstractions.

Also remove direct `console.log` debugging and use the logger when diagnostics
are needed.

### Contract Naming

The access profile response now uses the correctly spelled
`authorization.permissions` key. Keep `web.frontend.vue` usage coordinated with
this backend response shape.

### Startup Cache Ownership

`App.ts` has commented organisation cache startup/interval work. Decide whether
this service owns organisation cache refresh, or whether cache refresh should
belong to another service/process.

Redis cache ownership should be explicit because the parser, backend, and
writer all depend on Redis-backed state.

## Cross-Service Contracts

### Frontend Contract

`web.frontend.vue` depends on:

- Login and token responses from `/api/auth`.
- Access profile shape from `/api/access-profile`.
- Device, asset, organisation, group, and user API response shapes.
- Permission keys such as `org.view`, `asset.view`, `device.view`,
  `group.view`, and `user.view`.

When changing response shapes, update frontend usage and frontend docs at the
same time.

### Parser Contract

The Codec 12 command endpoint inserts command records and pushes them into
Redis under the parser prefix:

- `teltonika.parser.go:codec12:pending-commands:<imei>`

`teltonika.parser.go` later reads those commands and sends them to connected
devices.

Changes to this payload shape must be coordinated with the parser and
`telemetry.db.writer.node.ts` command sync.

### Redis Contract

This backend uses Redis for:

- JWT token version cache.
- User permission and permission-key cache.
- Shared device and organisation hashes under the `iotrack.live:` prefix.
- Codec 12 pending command lists under the `teltonika.parser.go:` prefix.

Keep prefixes explicit at call sites when interacting with another service's
Redis contract.

## Recommended Next Work

1. Secure the Codec 12 command route.
   - Add `authMiddleware`.
   - Add Zod validation for params and body.
   - Add a command-specific permission.

2. Scope list endpoints by user access.
   - Devices and assets should not return all records to any authenticated user.
   - Use the same organisation-scope logic already used by access profile and
     single-record checks.

3. Simplify permission middleware.
   - Prefer `request.userPerms` from `authMiddleware`.
   - Fetch from `AccessProfileController.getUserPermissionKeys` only as a
     fallback.

4. Clean access profile debug output.
   - Remove `console.log`.
   - Keep structured logger calls only where useful.

5. Document API contracts.
   - Start with access profile and Codec 12 command creation.
   - Keep contract docs short and close to the service.

6. Add focused tests.
   - Auth token validation.
   - Permission denial.
   - Organisation-scoped list behavior.
   - Access profile shape.
   - Codec 12 command creation and Redis push.

## Verification

Current compile check:

```sh
npm run build
```

This passed during the analysis pass.

There is no dedicated test suite visible yet, so `npm run build` is the minimum
verification step for backend TypeScript changes.

## Working Style

Keep changes readable and local.

Prefer:

- direct controller flow,
- clear variable names,
- small service/model helpers when they remove real duplication,
- Zod schemas near route boundaries,
- explicit Redis prefixes for cross-service keys,
- short comments explaining intent or service contracts.

Avoid:

- broad refactors while contracts are still moving,
- hiding simple controller behavior behind unnecessary abstractions,
- changing response shapes without checking frontend usage,
- adding new Redis key shapes without documenting the owner service.
