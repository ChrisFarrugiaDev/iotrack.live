# User Create/Edit Form — Selector UI Roadmap

Tracks the UI improvements for the four multi-selects (Permissions,
Organisations, Assets, Devices) on the Register/Edit User form.

Problem: with realistic data (100+ assets/devices) the selected values render
as an unbounded wall of chips, making the form very long and hard to read.
The dropdown side is fine — options are already grouped org → items in
`userAssignableStore.ts`; the issues are selected-value rendering and
bulk-selection ergonomics.

Components involved:

- `src/components/users/UserAssets.vue`
- `src/components/users/UserDevices.vue`
- `src/components/users/UserOrganisations.vue`
- `src/components/users/UserPermissions.vue`

## Steps

- [x] Step 1 — Cap the chip walls.
  - Add `:limit="10"` and a `limitText` (`and N more`) to all four
    `<Treeselect>` components so selections collapse to one row.
  - No payload or model change.

- [ ] Step 2 — Selectable org branches on Assets/Devices.
  - Remove `:disable-branch-nodes="true"` from `UserAssets.vue` and
    `UserDevices.vue` so one click on an org node selects all its items.
  - Add `value-consists-of="LEAF_PRIORITY"` so the emitted payload stays
    leaf ids (`form.assets` / `form.devices` unchanged).
  - Leave Permissions and Organisations as they are (Organisations uses
    `:flat="true"` deliberately).

- [ ] Step 3 — "Add by group" quick-pick.
  - Small single-select next to the Assets/Devices field listing groups of
    the matching type (`groupStore.getGroups`).
  - On pick: fetch members (`GET /api/group/:type/:id`), merge the returned
    ids into the current selection (filtered to ids present in the options
    tree), re-render, reset the picker.
  - Groups are not nested inside the tree — an item can belong to several
    groups and duplicate node ids break treeselect.

- [ ] Step 4 — Verify and close out.
  - `npm run build` after each step; manual test of create and edit flows.
  - Tick these checkboxes and reference this file from `ROADMAP.md`.

## Later (out of scope for now)

- Virtualized/searchable replacement component if item counts reach the
  thousands and treeselect becomes sluggish.
- Server-side pagination of `user/assignment-options`.
