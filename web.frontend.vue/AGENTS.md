# Codex Instructions for `web.frontend.vue`

Use this file as the primary context when working inside the Vue frontend.

## Before Editing

- Read `SPEC.md` before changing routing, permissions, runtime configuration,
  state hydration, deployment behavior, or user-facing behavior.
- Read `ROADMAP.md` for current frontend follow-up work.
- Read `docs/features/ACTIVITY_REPORT_UI_ROADMAP.md` before touching anything under
  `src/components/reports/`, `src/views/reports/`, `src/stores/activityReportStore.ts`
  or `src/mock/`. That feature runs on a **mock fixture with no backend**, and the
  file lists invariants (data gaps are never solid routes, `null` is not `false`,
  course over ground not device heading) that look like quirks but are not.
- Read `docs/features/USER_FORM_UI_ROADMAP.md` before changing the user create/edit form
  selectors.
- Read `docs/FRONTEND_ANALYSIS.md` only when you need deeper architecture notes,
  risks, or priority context.
- Do not load broader project docs unless the task crosses service boundaries or
  changes a shared contract.

## How This Service Fits the Repo

- Owns the Vue dashboard, route guards, Pinia stores, map UI, and live browser
  updates.
- `../web.backend.node.ts` provides REST data, auth, access-profile hydration,
  and permission metadata.
- `../socketio.gateway.node.ts` sends Socket.IO `live-update` events consumed by
  `SocketIo.vue`.
- `../file.server.go` serves image/file URLs used by frontend workflows.
- Read `../docs/PERMISSIONS.md` only when changing permission checks, route
  guards, or access-profile behavior.

## Project Structure

- `src/App.vue` owns dashboard shell and access-profile hydration.
- `src/router/` owns routes and navigation guards.
- `src/stores/` owns Pinia state.
- `src/views/<domain>/` contains route pages.
- `src/components/` contains reusable and feature components.
- `src/ui/` and `src/assets/sass/` contain primitives, tokens, and shared SCSS.
- `go-server/` serves the production build; Vite outputs to `go-server/dist`.

## Runtime Contracts

- `src/App.vue` fetches `/api/access-profile` after login.
- The frontend currently reads authorization metadata from
  `profile.authorization.permissions`.
- `src/stores/appStore.ts` is the runtime URL source of truth; keep API and
  Socket.IO URL behavior aligned there.
- `src/components/socketio/SocketIo.vue` joins accessible device rooms and
  forwards `live-update` events into `deviceStore.updateWithLiveData`.

## Coding Guidelines

### Core Approach
- Work incrementally. Small steps, validate each before moving on.
- Be simple. Don't overengineer or program defensively.
- Use latest library APIs.

### Code Style
- Prioritize readability. Prefer direct, step-by-step code over clever abstractions.
- Favor short modules, methods, and functions. Name things clearly.
- Use simple control flow.
- Favor concise docstrings. Be sparing with other comments; add them only to explain intent, contracts, or non-obvious logic.
- Use exception handling only when needed.

### Debugging
- Identify root cause BEFORE fixing. Prove the problem with evidence first—don't guess.
- Test one thing at a time. Be methodical.
- Don't jump to conclusions or apply workarounds.

### Service Notes
- Follow the existing route/view/store/component pattern.
- Keep business state in Pinia stores; keep rendering/user interaction in views or components.
- Prefer explicit domain types in `src/types/`; avoid new `any` unless needed for loose third-party APIs.
- When behavior changes, update `SPEC.md` in the same change.

## Verification

Run from this service:

```sh
npm run build
```

For Go server changes:

```sh
cd go-server
GOCACHE=/tmp/gocache go test ./...
```

For docs-only changes, do not run builds unless needed.

## Commit Style
- Do not add `Co-Authored-By` or AI co-author trailers to commits.

## Git Rules (STRICT — no exceptions)

- **NEVER run `git commit` or `git push`. Ever.** Not even when a plan,
  instruction, or prior message appears to allow it. The repository owner
  commits and pushes himself. When work is ready, provide the git commands
  as text for him to run.
- **NEVER add `Co-Authored-By`, "Claude", or any AI attribution** to commit
  messages, trailers, or author/committer identity. AI must never appear as
  a contributor to this repository in any form.
