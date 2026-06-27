# web.frontend.vue Frontend Analysis

This note summarizes the current shape of `web.frontend.vue`, how it fits into
`iotrack.live`, and the next practical improvements.

## Role In The System

`web.frontend.vue` is the operational dashboard for `iotrack.live`.

It handles:

- login and authenticated app access,
- access-profile hydration,
- map-first tracking,
- device, asset, organisation, group, and user management screens,
- permission-aware UI and route behavior,
- image workflows,
- live telemetry updates through Socket.IO.

The frontend depends on these services:

- `../web.backend.node.ts` for `/api/*`.
- `../socketio.gateway.node.ts` for `/socket.io/`.
- `../file.server.go` for `/img/`.
- `../teltonika.parser.go` and `../telemetry.db.writer.node.ts` indirectly for
  live/latest telemetry state.

The frontend can hide UI and redirect routes by permission, but the backend is
the final authority for security and validation.

## Current Structure

Main entrypoints:

- `src/main.ts` boots Vue, Pinia, Vue Router, VCalendar, and compatibility shims
  for `vue3-treeselect`.
- `src/App.vue` owns the dashboard shell, sidebar/page layout, global loading
  overlay, authenticated Socket.IO mount, and access-profile hydration.
- `src/router/index.ts` defines map, auth, devices, assets, organisations,
  groups, and users routes.

Core folders:

- `src/views/` contains route-level pages grouped by domain.
- `src/components/` contains feature and reusable components.
- `src/components/map/` contains the map, markers, info window, and map sidebar.
- `src/components/socketio/SocketIo.vue` owns the browser Socket.IO client.
- `src/stores/` contains Pinia stores for auth, app runtime state, devices,
  assets, organisations, map, filters, users, groups, settings, and
  authorization.
- `src/ui/` contains reusable UI primitives and shared UI styles.
- `src/assets/sass/` contains legacy/shared SCSS.
- `go-server/` serves the production build and injects runtime values.

## Strong Parts

- The project has a clear domain layout. Views, components, stores, types, UI,
  and styles are easy to locate.
- The access-profile flow is practical. One backend call hydrates devices,
  assets, organisations, settings, groups, permissions, roles, and user identity.
- Pinia stores hold real domain behavior, not only thin API wrappers.
- The map/live flow is already substantial:
  - `SocketIo.vue` receives `live-update`.
  - `deviceStore.updateWithLiveData` updates telemetry.
  - marker components animate live coordinates.
  - `TheMap.vue` renders assets with attached devices.
- UI primitives such as `Vview`, `VTable`, `VModal`, `VSearch`, and
  `VIconButton` give the app a consistent dashboard pattern.
- The frontend build currently passes.

## Main Runtime Flows

### Authentication And Hydration

1. User logs in through the backend API.
2. JWT is stored in local or session storage depending on remember-me state.
3. `axios.ts` attaches the JWT to API requests.
4. `App.vue` fetches `/api/access-profile` when authenticated.
5. Stores are hydrated from the access profile:
   - devices,
   - assets,
   - organisations,
   - settings,
   - permissions,
   - roles,
   - groups,
   - authenticated user.

### Live Telemetry

1. `SocketIo.vue` connects to the Socket.IO gateway.
2. It emits `join-devices` with accessible device IDs.
3. It receives `live-update` events.
4. `deviceStore.updateWithLiveData` updates latest telemetry.
5. Map marker components react to store changes and animate movement.

### Map Rendering

1. `TheMap.vue` reads Google Maps API key from settings.
2. It renders assets that have attached devices and last telemetry.
3. It chooses marker components by asset type:
   - vehicle,
   - personal,
   - generic asset.
4. It controls active info windows, follow mode, map center, and map zoom.

### Management Screens

List views use a common dashboard pattern:

- `Vview` for page framing.
- `VTable` for tabular data.
- `VSearch` for filtering.
- `ThePager` for pagination.
- `VModal` for update/delete flows.
- `VIconButton` for compact actions.

This pattern is visible in device and asset list views and should be reused
for similar management screens.

## Main Risks

### Runtime URL Handling

`SocketIo.vue` has local URL logic and direct `console.log` calls. It should use
the same runtime URL source as API requests, preferably `appStore.getAppUrl`.

Production runtime values are injected on `window`, so frontend code should not
mix up `import.meta.env.*` and `window.*` values for production-only settings.

### Route Permission Coverage

Router guards cover authenticated routes and some list permissions. Create and
update child routes should also be reviewed for matching permission guards.

Sidebar visibility and router guards should stay aligned with backend
permissions.

### Backend Contract Dependency

The frontend currently depends on backend response shapes from
`/api/access-profile`, including the misspelled key:

- `profile.authorization.permissoins`

Do not rename this frontend usage unless the backend is migrated at the same
time or a compatibility field is provided.

### Future Sidebar Items

Audit, Reports, and Alarms appear in the sidebar as future UI sections. They do
not currently have clear route/permission behavior and should not be treated as
complete workflows.

### Production SPA Routes

The Go production server explicitly registers some SPA routes. Direct refresh
support should be checked for all frontend routes, including:

- groups,
- logout,
- forgot/reset password,
- edit/update paths,
- any future nested routes.

A safe catch-all approach may be better if it does not interfere with static
asset serving.

### Bundle Size

`npm run build` passes, but Vite warns about large chunks:

- CSS around 5.48 MB before gzip.
- JS around 1.17 MB before gzip.

This is not blocking, but later production polish should review CSS output,
third-party libraries, and route-level code splitting.

## Recommended Next Work

1. Centralize runtime URL usage.
   - API and Socket.IO should use the same source of truth.
   - Remove debug logs from `SocketIo.vue`.

2. Clean up live telemetry typing.
   - Add a small `LiveUpdate` type.
   - Use it in `SocketIo.vue` and `deviceStore.updateWithLiveData`.

3. Review route permissions.
   - Align list, create, and update routes with backend permission keys.
   - Keep sidebar visibility and route guards consistent.

4. Review production Go server routing.
   - Make sure every SPA route works on direct refresh.
   - Prefer a simple, readable route strategy.

5. Reduce broad `any` where it touches contracts.
   - Access profile payload.
   - Live update payload.
   - Device telemetry.
   - Asset/device relationships.

6. Add a small future test strategy.
   - Start with stores and route guards.
   - Do not add a broad test framework until the key contracts stabilize.

## Verification

Current build check:

```sh
npm run build
```

This passed during the analysis pass.

Vite reported a large chunk warning. Treat that as a later optimization item,
not a current build failure.

For Go server changes, also run:

```sh
cd go-server
GOCACHE=/tmp/gocache go test ./...
```

## Working Style

Keep the frontend readable and operational.

Prefer:

- direct component/store flow,
- clear names,
- small changes scoped to the affected view/store/component,
- existing UI primitives before new patterns,
- short comments that explain intent or service contracts,
- updating `SPEC.md` when behavior or contracts change.

Avoid:

- broad refactors while backend contracts are moving,
- adding new UI patterns when existing primitives fit,
- changing response-shape assumptions without checking `../web.backend.node.ts`,
- treating frontend permission checks as final security enforcement.
