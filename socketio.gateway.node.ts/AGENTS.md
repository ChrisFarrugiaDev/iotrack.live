# Codex Instructions for `socketio.gateway.node.ts`

Use this file as the primary context when working inside this service.

## Before Editing

- Keep this service narrow: Redis Pub/Sub in, Socket.IO events out.
- Check parser live payload shape before changing Redis message parsing.
- Check frontend Socket.IO usage before changing event names, rooms, auth, or
  payload shape.

## How This Service Fits the Repo

- Receives parser live telemetry from Redis Pub/Sub channel `teltonika:live`.
- Emits Socket.IO `live-update` events to device rooms consumed by
  `../web.frontend.vue`.
- Uses backend-compatible JWT/access data for Socket.IO auth and device-room
  authorization.
- Check `../teltonika.parser.go` before changing Redis live payload parsing.
- Check `../web.frontend.vue` before changing Socket.IO event names, room joins,
  or payload shape.

## Project Structure

- `src/server.ts` starts the service.
- `src/App.ts` wires Redis subscription and Socket.IO server.
- `src/redis/subscriber.ts` handles Redis Pub/Sub subscription.
- `src/socketio/server.ts` owns Socket.IO auth, room joins, and events.
- `src/config/` owns env, Prisma, and Redis clients.

## Contract Safety

- Redis live channel is `teltonika:live`.
- Keep `live-update` event payload compatible with frontend expectations.
- Keep room naming consistent with frontend join behavior.
- If changing Socket.IO auth or room authorization, inspect frontend and backend
  access-profile behavior.

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
npm run build
```

If tests are added, focus on plain JSON live payloads, malformed Redis messages,
missing device IDs, room joins, and auth failures.

## Commit Style
- Do not add `Co-Authored-By` or AI co-author trailers to commits.
