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

- [ ] **Gate the Reports sidebar item on `report.view` (security debt).**
  - On branch `feat/activity-report-ui`, Reports now opens a flyout
    (`TheReportsMenu.vue`) leading to the Activity Report — but `report.view`
    is not seeded, there is no `routePermissions` entry, and the report is
    built from **mocked telemetry**. It is reachable by every user.
  - Seed the key, add `'reports.activity': 'report.view'` to the router map,
    and gate the sidebar item. See `docs/features/ACTIVITY_REPORT_UI_ROADMAP.md` and design
    doc §20.

- [ ] Define future sidebar items before enabling workflows.
  - Audit and Alarms still appear in `TheSidebar.vue` as placeholder items with
    no click handler, no routes, and no permission gating; they are visible to
    every user. (Reports is now wired — see the item above.)
  - Current state of permission keys:
    - `audit.view` already exists in `initdb-scripts/05-tables.sql`
      (category `admin`) but is unused by backend and frontend.
    - Reports and Alarms have no permission keys yet.
  - Proposed keys, following the existing `<entity>.<action>` convention:
    - Audit: `audit.view` (read-only section; no create/update planned).
    - Reports: `report.view`, plus `report.create` if report definitions
      become user-editable.
    - Alarms: `alarm.view`, `alarm.create`, `alarm.update`, `alarm.delete`.
  - Proposed routes, following the existing route naming convention:
    - `/audit` → `audit.list`.
    - `/reports` → `reports.list` (+ `reports.create` if needed).
    - `/alarms` → `alarms.list`, `alarms.create`, `alarms.edit`.
  - Implementation order when a section is picked up:
    1. Seed permission keys in `initdb-scripts` and enforce them in
       `web.backend.node.ts` (security boundary).
    2. Add routes and views, plus entries in the router
       `routePermissions` map.
    3. Gate the sidebar item with `authorizationStore.can(...)` and wire
       its `goToView(...)` click handler.
  - Until then the sidebar items stay as visible placeholders by choice.


## Completed

- [x] Improve user form asset/device/org selectors.
  - Chip walls capped, whole-org selection, and group quick-pick; tracked in
    `docs/features/USER_FORM_UI_ROADMAP.md`.

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
