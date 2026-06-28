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

- [ ] Align sidebar visibility with route guards.
  - Hide `Groups` when `authorizationStore.can("group.view")` is false.
  - Keep sidebar visibility and router redirects based on the same permission
    keys.

- [ ] Fix the group create tab permission.
  - `GroupView.vue` should use `group.create`.
  - It currently checks `device.create`, which can show or hide the tab for the
    wrong users.

- [ ] Expand route guard coverage.
  - List routes already check `*.view` permissions.
  - Add matching permission behavior for create and update child routes.
  - Keep frontend guards as UX helpers only; backend checks remain final.

- [ ] Define future sidebar items before enabling workflows.
  - Audit, Reports, and Alarms currently appear as future UI sections.
  - Add routes and permission keys before treating them as complete features.


## Completed

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
