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

- [ ] Fix cross-org IDOR on `user/:id/*` subroutes (high priority).
  - `permissions`, `organisations`, `assets`, and `devices` handlers fetch
    the target user without checking the requester's org scope, so any user
    with `user.view` can read any user in the system by iterating IDs.
  - Fix: after loading the target user, 403 unless
    `target.organisation_id` is within the requester's accessible org set.


## Completed

- [x] Fix assignment-options scope bypass.
  - `POST /api/user/assignment-options` now returns 403 unless the requested
    `org_id` is inside the requester's accessible org set (computed from the
    JWT identity).
  - The root user ID (`"1"`) in the resource lookups is kept deliberately:
    assignment options must list the org's full resources, not filtered by
    the requester's personal overrides. The old TODO comment is replaced by
    an explanation.

- [x] Verify group read-endpoint scoping.
  - `GET /api/group/:type/:id` denies access unless the group belongs to the
    requester's own organisation. Note: this is stricter than the org-subtree
    scope used elsewhere (a parent-org admin cannot view child-org groups).

- [x] Review authenticated list endpoints.
  - Read routes now require matching view permissions: `asset.view` on the
    asset list, `device.view` on the device list and detail, `user.view` on
    the user list and `user/:id/*` subroutes.
  - Asset and device index responses are now scoped via
    `computeAccessibleOrganisationIds` and the access-profile
    `getAccessibleAssetsForUser` / `getAccessibleDevicesForUser` helpers
    (org scope plus per-user deny overrides) instead of `getAll()`.
  - `device/catalog`, `user/assignment-options`, and `access-profile` stay
    open to any authenticated user by design.

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
