# IoTrack Live Frontend Specification

## Purpose

IoTrack Live is a dashboard-style Vue application for managing and monitoring IoT-tracked assets, devices, users, groups, and organisations. The app provides authenticated access to operational views and a map-first live tracking experience.

## Application Scope

The frontend is responsible for:

- Authenticating users with the backend API.
- Loading the authenticated user's access profile.
- Rendering route-level views for map, devices, assets, organisations, users, and groups.
- Enforcing client-side navigation and UI visibility from permission keys.
- Displaying live device telemetry through Socket.IO.
- Serving static assets and image URLs provided by backend services.

The frontend is not responsible for enforcing final security decisions. The backend must still validate authentication, authorisation, and submitted payloads.

## Repository Layout

Key files and directories:

- `src/main.ts` boots the Vue app, installs Pinia, Vue Router, and shared plugins.
- `src/App.vue` owns the dashboard shell, auth-aware layout, and access-profile hydration.
- `src/router/` contains client-side routes and navigation guards.
- `src/stores/` contains Pinia stores for auth, authorization, devices, assets, users, groups, organisations, map state, and settings.
- `src/views/` contains route-level pages. Domain pages should stay grouped by feature, such as `src/views/devices/`.
- `src/components/` contains reusable UI and feature components.
- `src/ui/` and `src/assets/sass/` contain primitives, tokens, SVG sprites, and shared SCSS.
- `public/` contains static runtime assets.
- `go-server/` contains the Go/Chi server used to serve the production frontend.

## Runtime Architecture

Development runs through Vite using values from `.env`, especially `VITE_APP_URL`.

Production is served by the Go app in `go-server/`. Vite builds the frontend into `go-server/dist`, and the Go template injects runtime values into `window`:

```js
window.GO_DOCKERIZED = "{{ .GO_DOCKERIZED }}" === "true";
window.GO_APP_URL = "{{ .GO_APP_URL }}";
```

When `window.GO_DOCKERIZED` is true, client API calls should use `window.GO_APP_URL`. Otherwise they should use Vite env values.

Do not commit real secrets or production-only values. Keep local-only values in `.env` and production values in the hosting environment that starts the Go server.

Apache proxy configuration is kept in `iotrack.live.conf`:

- `/api/` proxies to the API service.
- `/img/` proxies to the image/file service.
- `/socket.io/` proxies to the Socket.IO service.
- `/` proxies to the Go frontend server.

## Routing & Access Control

Vue Router uses history mode. Authenticated routes should require a valid JWT. Public routes are limited to login, forgot-password, and reset-password flows.

Permission checks should be applied in two places:

- UI visibility, such as sidebar items and action buttons.
- Router guards, so direct navigation to restricted views redirects to `map.view`.

Permission keys should match backend-provided access profile values, for example `org.view`, `user.view`, `asset.view`, `device.view`, and `group.view`.

## State Management

Pinia stores hold domain state. Keep API-facing domain state in the relevant store:

- `authStore.ts` for JWT, remember-me, and redirect handling.
- `authorizationStore.ts` for roles, permissions, and `can(...)` checks.
- Domain stores such as `deviceStore.ts`, `assetStore.ts`, `organisationStore.ts`, `userStore.ts`, and `groupStore.ts`.
- `appStore.ts` for runtime app URL and cross-store cleanup.

`App.vue` currently hydrates stores from `/api/access-profile`.

## UI & Styling

Use existing Vue components, SCSS tokens, and UI primitives before creating new patterns. Domain pages should stay under `src/views/<domain>/`, while reusable pieces belong in `src/components/` or `src/ui/`.

The dashboard should remain operational and compact rather than marketing-oriented. Prioritize clear tables, forms, map controls, modals, and permission-aware actions.

## Verification Requirements

Before considering frontend changes complete, run:

```sh
npm run build
```

For Go server changes, also run:

```sh
cd go-server
GOCACHE=/tmp/gocache go test ./...
```

Use the `GOCACHE` override when the default Go cache is not writable.

## Known Follow-Up Areas

- Keep production runtime injection aligned with `appStore.ts` and Socket.IO setup.
- Ensure all create/edit/list routes have matching permission guards.
- Replace broad `any` usage with domain types where it affects shared contracts.
- Expand tests when a frontend test framework is introduced.
