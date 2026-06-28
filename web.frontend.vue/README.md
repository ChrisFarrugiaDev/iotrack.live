# web.frontend.vue

Vue 3 frontend for `iotrack.live`.

This app is the user-facing dashboard for the platform. It handles login,
management screens, permission-aware navigation, map views, and live telemetry
updates.

For deeper architecture notes and current risks, read `FRONTEND_ANALYSIS.md`.

## How It Fits

`web.frontend.vue` depends on the other services instead of owning backend
business rules:

- `web.backend.node.ts` provides `/api/*` REST endpoints for auth, access
  profiles, assets, devices, organisations, groups, and users.
- `socketio.gateway.node.ts` provides `/socket.io/` live telemetry events.
- `file.server.go` provides `/img/` image upload, list, and delete behavior.
- `teltonika.parser.go` ingests Teltonika data and publishes live/durable
  telemetry used by the gateway and database writer.
- `telemetry.db.writer.node.ts` persists telemetry and syncs latest device
  state back to the database.
- `computation.server.go` is still early-stage and should not drive frontend
  behavior until its first responsibility is defined.

The frontend can hide or redirect UI by permission, but the backend is still
the final authority for authentication, authorization, and data validation.

## Main Runtime Flows

- Login stores a JWT in local or session storage.
- `App.vue` fetches `/api/access-profile` and hydrates domain stores.
- Axios attaches the JWT to backend API requests.
- `SocketIo.vue` joins accessible device rooms and listens for `live-update`.
- `deviceStore.updateWithLiveData` updates latest telemetry and drives map marker movement.
- `TheMap.vue` renders assets with attached devices and last telemetry.

## Project Shape

- `src/main.ts` boots Vue, Pinia, Router, and shared plugins.
- `src/App.vue` owns the dashboard shell and access-profile hydration.
- `src/router/` contains routes and guards.
- `src/stores/` contains Pinia stores.
- `src/components/socketio/SocketIo.vue` owns the browser Socket.IO client.
- `src/components/map/` owns map rendering, markers, info windows, and map sidebar.
- `src/views/` contains route-level pages grouped by domain.
- `src/components/` contains reusable and feature components.
- `src/ui/` and `src/assets/sass/` contain shared UI primitives, tokens, and
  styles.
- `go-server/` serves the production build.

Read `SPEC.md` before changing routing, permissions, runtime configuration,
state hydration, deployment behavior, or user-facing behavior.

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

`npm run build` runs type checking and the Vite production build.

For Go server changes:

```sh
cd go-server
GOCACHE=/tmp/gocache go test ./...
```

Use the `GOCACHE` override when the default Go cache is not writable.

## Working Style

Prefer readable, straightforward code. Keep domain behavior in the matching
store, view, or component. Use existing UI primitives and SCSS conventions
before adding new patterns. Add short comments only where they explain intent or
make a workflow easier to follow.

Known current areas to handle carefully:

- Keep API and Socket.IO runtime URL handling aligned with `appStore`.
- Keep route guards and sidebar visibility aligned with backend permission keys.
- Keep `authorization.permissions` aligned with the backend access-profile response.
- Check `go-server` routing when adding new frontend routes that must work on direct refresh.
