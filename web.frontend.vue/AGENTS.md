# Repository Guidelines

## General Instructions

- ALWAYS - Before making any file changes, explain what you plan to change and why.
- ALWAYS - Show the relevant files or code areas you plan to touch before editing.
- ALWAYS - Wait for the user's approval before creating, editing, deleting, formatting, or moving files.
- ALWAYS - If the user says `go`, treat that as approval for the specific next step only.
- ALWAYS - If the user asks for an explanation, teach step by step and keep the language beginner-friendly.
- ALWAYS - If adding comments, use short `//` comments only where they help learning or readability.
- ALWAYS - Prioritize readable, straightforward code over clever shortcuts; use clear names and simple control flow.

## Project Structure & Module Organization

This repository is a Vue 3 + Vite frontend with a small Go server for the production build.

- Read `SPEC.md` before changing routing, permissions, runtime configuration, state hydration, deployment behavior, or user-facing behavior.
- App code lives in `src/`; route pages are in `src/views/<domain>/`, reusable components in `src/components/`, Pinia stores in `src/stores/`, and shared UI/SCSS in `src/ui/` and `src/assets/sass/`.
- Static assets live in `public/`.
- The Go/Chi production server lives in `go-server/`; Vite outputs to `go-server/dist`.

## Build, Test, and Development Commands

```sh
npm install
npm run dev
npm run build
npm run preview
```

- `npm run dev` starts the Vite development server.
- `npm run build` runs `vue-tsc --build` and `vite build`.
- `npm run preview` serves the built frontend locally through Vite.

For the Go server:

```sh
cd go-server
GOCACHE=/tmp/gocache go test ./...
```

Use the `GOCACHE` override in restricted environments where the default Go cache is not writable.

## Coding Style & Naming Conventions

Use TypeScript, Vue single-file components, and Pinia composition stores. Keep feature files named by domain and purpose, for example `DeviceListView.vue`, `AssetUpdateView.vue`, and `authStore.ts`.

Follow the existing tab-indented style in Vue and TypeScript files. Prefer explicit types in `src/types/`; avoid new `any` unless integrating with loosely typed packages.

SCSS should use the token and utility setup under `src/ui` and `src/assets/sass`.

When behavior changes, update `SPEC.md` in the same change so implementation and expected behavior stay aligned.

## Testing Guidelines

There is no dedicated frontend unit test setup yet. At minimum run:

```sh
npm run build
```

For server changes, also run:

```sh
cd go-server
GOCACHE=/tmp/gocache go test ./...
```

Name future frontend tests near their subject, using patterns like `DeviceListView.spec.ts` or `authStore.spec.ts`.

## Commit & Pull Request Guidelines

Recent history uses short messages such as `updating progress` and `initialize computation server`. Keep commits concise, but prefer clearer scope, for example `fix runtime env injection` or `update device list permissions`.

Pull requests should include a summary, verification commands, linked issue or task when available, and screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit real secrets or production-only values. Keep runtime configuration details documented in `SPEC.md`.
