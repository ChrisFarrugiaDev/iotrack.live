# Permission Model

This document explains how permissions are defined, enforced, and consumed
across `iotrack.live`.

The backend is the final authority for security. The frontend uses the same
permission keys for navigation and UI visibility, but those checks are only
user-experience helpers.

## Database Setup

The permission source of truth starts in `initdb-scripts/05-tables.sql`.

Core tables:

- `app.roles` defines the built-in roles:
  - `1` - `sys_admin`
  - `2` - `admin`
  - `3` - `user`
  - `4` - `viewer`
- `app.permissions` defines stable permission keys such as `user.view`,
  `asset.create`, `device.update`, and `group.delete`.
- `app.role_permissions` assigns default permissions to each role.
- `app.user_permissions` stores per-user overrides. `is_allowed = true` grants
  a permission beyond the role default. `is_allowed = false` removes a
  permission granted by the role.

Effective user permissions are therefore:

1. Start with the user's role permissions.
2. Add user-level `true` overrides.
3. Remove user-level `false` overrides.

The current permission groups are users, organisations, audit, assets, devices,
and groups.

## Backend Flow

`web.backend.node.ts` owns REST authentication and authorization.

Login flow:

1. `/api/auth/login` verifies email and password.
2. The backend issues a JWT containing user ID, role ID, active organisation ID,
   and token version.
3. The frontend stores the JWT and sends it on later API calls.

Request auth flow:

1. `authMiddleware` verifies the JWT.
2. It checks the token version through Redis, falling back to PostgreSQL.
3. It attaches `userID`, `userOrgID`, and `userRoleID` to the Fastify request.
4. It loads effective permission keys and attaches them as `request.userPerms`.

Permission computation:

1. `AccessProfileController.getUserPermissions` loads role permission IDs and
   user permission overrides.
2. It applies overrides to build an effective permission ID list.
3. `getUserPermissionKeys` maps those IDs to keys from `app.permissions`.
4. Results are cached in Redis with the `iotrack.live:` prefix.

Route checks:

- Routes use `requirePermissions(["some.key"])` in `preHandler`.
- Role ID `1` is a root bypass and can pass every route permission check.
- Non-root users must have every required key.
- A failed check returns `403` with `PERMISSION_DENIED`.

Important current behavior:

- Some routes only require authentication and do additional scope checks inside
  controllers.
- Backend list endpoints should still be reviewed so broad lists are scoped by
  the authenticated user's accessible organisations, assets, or devices.
- `requirePermissions` currently reloads permission keys even though
  `authMiddleware` already attaches `request.userPerms`.

## Access Profile Contract

`/api/access-profile` hydrates the frontend after login or organisation switch.

Permission-related fields:

- `access.permissions` contains the current user's effective permission keys.
- `authorization.roles` contains app role metadata for the user-management UI.
- `authorization.permissions` contains app permission metadata for the
  user-management UI.
- `authorization.role_permissions` contains default role-to-permission mappings.

The access-profile authorization metadata key is now correctly spelled as
`authorization.permissions`. Keep backend response shape and frontend hydration
aligned when changing this contract.

## Frontend Flow

`web.frontend.vue` consumes backend permissions for navigation and UI state.

Hydration flow:

1. `App.vue` fetches `/api/access-profile`.
2. Domain stores are hydrated with assets, devices, organisations, groups, and
   settings.
3. `authorizationStore` is hydrated with roles, permission metadata,
   role-permission mappings, and the current user's effective permission keys.

Runtime checks:

- `authorizationStore.can("permission.key")` is the central frontend check.
- The user's effective permission keys are stored in local storage under
  `iotrack.user.permissions`.
- Sidebar items, action buttons, tabs, and route guards call `can(...)`.
- If `rootOverIsActive` is enabled in the frontend store, `can(...)` returns
  true locally. This is a UI override only and does not bypass backend checks.

Route and UI behavior:

- Authenticated routes require a JWT in `authStore`.
- List routes for organisations, users, assets, devices, and groups redirect to
  `map.view` if the matching `*.view` permission is missing.
- Buttons for create, update, delete, and assign-device actions are hidden when
  the related permission is missing.
- User create/update screens use role defaults plus selected permissions to
  build `user_permissions` override maps for the backend.

## Current Findings

Known permission gaps or cleanup items:

- `POST /api/teltonika/codec12/commands/:imei` currently queues physical device
  commands and should require auth, validation, and a command-specific
  permission.
- Frontend `Groups` appears in the sidebar even when `group.view` is missing,
  while the router guard redirects direct access.
- `GroupView.vue` uses `device.create` to show the group create tab. It should
  use `group.create`.
- Frontend route guards cover list routes, but create and update child routes
  should also be aligned with backend permission keys.
- Audit, Reports, and Alarms appear as sidebar items but do not yet have clear
  route and permission behavior.
- Access-profile authorization metadata now uses
  `authorization.permissions`.
