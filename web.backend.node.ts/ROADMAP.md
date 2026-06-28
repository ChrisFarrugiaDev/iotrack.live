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

- [ ] Secure the Codec 12 command route.
  - Add `authMiddleware` to `POST /api/teltonika/codec12/commands/:imei`.
  - Add Zod validation for `imei` and command payloads.
  - Add a command-specific permission, for example `device.command`.
  - Add the new permission to `initdb-scripts/05-tables.sql` and assign safe
    role defaults deliberately.

- [ ] Review authenticated list endpoints.
  - Confirm whether each list route should require a matching `*.view`
    permission.
  - Scope broad list responses by the authenticated user's accessible
    organisations, assets, or devices.
  - Keep backend authorization as the final authority even when the frontend
    hides restricted UI.

- [ ] Simplify permission middleware.
  - Prefer `request.userPerms` when `authMiddleware` has already loaded it.
  - Keep a fallback to `AccessProfileController.getUserPermissionKeys` for
    defensive behavior.
  - Preserve the root role bypass for role ID `1`.

- [ ] Plan the access-profile permission key migration.
  - The current response key is `authorization.permissoins`.
  - Do not rename it until `web.frontend.vue` is updated in the same change.
  - Consider a compatibility period that returns both `permissoins` and
    `permissions`.

## Completed

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
