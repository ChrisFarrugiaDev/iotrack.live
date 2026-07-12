# web.backend.node.ts Roadmap

This file tracks recommended engineering work for `web.backend.node.ts`.
`SPEC.md` remains the source of truth for the service role, contracts, and
expected runtime behavior.

## Current State

- The service owns REST authentication, access-profile hydration, API
  validation, Prisma data access, and backend permission checks.
- Permission keys are defined in PostgreSQL and resolved from role defaults plus
  per-user overrides.
- `authMiddleware` verifies JWTs, checks token version, and attaches permission
  context to the Fastify request.
- `requirePermissions` protects selected routes, while some authenticated routes
  still rely on controller-level checks or need review.
- The Codec 12 command route currently queues commands to devices and needs
  explicit auth, validation, and permission enforcement.

## Recommended Work

- [ ] Review authenticated list endpoints.
  - Confirm whether each list route should require a matching `*.view`
    permission.
  - Scope broad list responses by the authenticated user's accessible
    organisations, assets, or devices.
  - Keep backend authorization as the final authority even when the frontend
    hides restricted UI.


## Completed

- [x] Simplify permission middleware.
  - `requirePermissions` now uses `request.userPerms` loaded by
    `authMiddleware`, falling back to
    `AccessProfileController.getUserPermissionKeys` only when missing.
  - The root role bypass for role ID `1` is unchanged.

- [x] Secure the Codec 12 command route.
  - `POST /api/teltonika/codec12/commands/:imei` now runs `authMiddleware`,
    Zod validation for the `imei` param and command body, and
    `requirePermissions(["device.command"])`.
  - `device.command` is seeded in `initdb-scripts/05-tables.sql` with role
    defaults.

- [x] Document the current permission model.
  - `docs/PERMISSIONS.md` now explains database permission setup, backend
    enforcement, frontend consumption, and current permission gaps.
  - `SPEC.md` links to the central permission guide.

- [x] Create this service roadmap.
  - Backend permission gaps are now tracked here instead of only in chat.

## Validation Notes

- Docs-only roadmap changes do not require `npm run build`.
- For backend behavior changes, run `npm run build` from this service.
- Keep `docs/PERMISSIONS.md` updated when permission keys, route requirements,
  or access-profile shapes change.
