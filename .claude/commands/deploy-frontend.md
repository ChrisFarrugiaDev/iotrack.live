---
description: Build the Vue frontend and rsync it to the server
allowed-tools: Bash
---

Build the frontend and, only if the build succeeds, deploy it.

Run this single command from the repo root:

```sh
cd web.frontend.vue && npm run build && make -C .. sync
```

The `&&` matters: `npm run build` runs `vue-tsc` via `type-check`, so a type
error aborts the chain before `rsync` touches the server. Never run `make sync`
on its own to "finish the deploy" after a failed build.

The Go server serves `dist/` from disk, so there is nothing to restart — the
sync is the deploy.

Then report the outcome:

- Deployed: say so plainly, and mention what was synced.
- Build failed: show the errors and state clearly that **nothing was deployed**.

