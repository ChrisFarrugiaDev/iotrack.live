# web.frontend.vue Roadmap

This file tracks recommended engineering work for `web.frontend.vue`.
`SPEC.md` remains the source of truth for the service role, contracts, and
expected runtime behavior.

## Current State

- The frontend hydrates runtime state from `/api/access-profile` after login.
- `authorizationStore.can(...)` is the central permission check for UI
  visibility and route redirects.
- Frontend checks are UX helpers only; backend checks remain the security
  boundary.
- The frontend currently depends on the access-profile key
  `authorization.permissions`.
- Some route guards and sidebar/action visibility rules need to be aligned with
  backend permission keys.

## Recommended Work

- [ ] Define future sidebar items before enabling workflows.
  - Audit, Reports, and Alarms currently appear as future UI sections.
  - Add routes and permission keys before treating them as complete features.


## Completed

- [x] Expand route guard coverage.
  - `router/index.ts` now maps every list/create/update child route to its
    permission key in a single `routePermissions` table, replacing the five
    list-only checks. Guards stay UX helpers; backend checks remain final.

- [x] Align sidebar visibility with route guards.
  - `TheSidebar.vue` now hides `Groups` when `group.view` is missing, matching
    the router redirect and the other permission-gated sidebar items.

- [x] Fix the group create tab permission.
  - `GroupView.vue` now gates the "Create new Group" tab on `group.create`.
  - It previously checked `device.create` (copy-paste from `DeviceView.vue`),
    which showed or hid the tab for the wrong users.

- [x] Document the current permission model.
  - `docs/PERMISSIONS.md` now explains database permission setup, backend
    enforcement, frontend consumption, and current permission gaps.
  - `SPEC.md` links to the central permission guide.

- [x] Create this service roadmap.
  - Frontend permission UI and route guard gaps are now tracked here instead of
    only in chat.

## Validation Notes

- Docs-only roadmap changes do not require `npm run build`.
- For frontend behavior changes, run `npm run build` from this service.
- Keep `docs/PERMISSIONS.md` updated when permission UI behavior, route guards,
  or access-profile consumption changes.
