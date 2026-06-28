# Codex Instructions for `file.server.go`

Use this file as the primary context when working inside this service.

## Before Editing

- Keep changes local to image/file behavior unless the user asks for a
  cross-service change.
- Check frontend/backend URL expectations before changing routes, response
  shapes, or stored URL formats.
- Do not change upload storage paths or cleanup behavior without documenting the
  contract.

## How This Service Fits the Repo

- Owns `/img/` image/file upload, list, serve, update, and delete workflows.
- `../web.frontend.vue` uses image URLs and upload/list/delete behavior in UI
  workflows.
- `../web.backend.node.ts` coordinates app data that may reference image/file
  URLs.
- Stores image metadata in PostgreSQL and image files under the configured
  upload volume.
- Check frontend/backend expectations before changing routes, response shapes,
  stored URLs, or storage paths.

## Project Structure

- `cmd/web/main.go` starts the service.
- `cmd/web/settings.go` loads environment and app settings.
- `internal/httpserver/` wires the HTTP server.
- `internal/api/routers/` defines image routes.
- `internal/api/handlers/images_handler.go` handles upload, serve, list, and
  delete flows.
- `internal/models/` wraps database access.

## Contract Safety

- Preserve `/img/` route behavior unless changing frontend/backend consumers in
  the same task.
- Preserve image URL shape and stored path assumptions unless explicitly asked.
- Keep file path handling safe and readable.

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

## Verification

Run from this service:

```sh
GOCACHE=/tmp/gocache go test ./...
```

Image processing depends on system libraries used by `bimg` / libvips.

## Commit Style
- Do not add `Co-Authored-By` or AI co-author trailers to commits.
