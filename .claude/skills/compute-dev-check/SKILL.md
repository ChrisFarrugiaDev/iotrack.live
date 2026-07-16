---
name: compute-dev-check
description: Verify computation.server.go against the remote dev environment. Use whenever you need to run or smoke-test the computation server locally, mint a test JWT for any role, hit /compute/* endpoints with curl, run SQL against the dev database (there is no local psql and no local Docker DB — the dev PostgreSQL lives on the remote box), seed or inspect permissions, or walk the Phase 1 acceptance matrix. Reach for this before hand-writing any token-minting Python, DB_URL host-swapping, background go run, or throwaway pgx query programs — the bundled scripts already do all of that.
---

# Compute Dev Check

Scripted verification for `computation.server.go`. The dev PostgreSQL runs on
the **remote** box (`57.129.22.122:5436`), not locally; the service env files
say `127.0.0.1` because in production the DB is on the same machine. These
scripts do the host swap, secret loading, lifecycle, and SQL access so none of
it is re-derived by hand.

All scripts live in `scripts/` next to this file. They locate the repo via
`git rev-parse`, so run them from anywhere inside the repo.

## Run the server

```sh
scripts/devserver.sh start    # build + boot on port 4404, waits for health
scripts/devserver.sh status
scripts/devserver.sh log      # tail the server log
scripts/devserver.sh stop     # SIGTERM, waits for graceful shutdown
```

Builds a real binary (not `go run`) so `stop` kills the actual server —
`go run` leaves a parent whose child survives naive kills. Port defaults to
4404 to avoid colliding with a production-style 4004. **Always `stop` when
done** — the server holds connections to the shared dev database.

## Mint a test token

```sh
TOKEN=$(scripts/mktoken.py --role 2)                # admin
TOKEN=$(scripts/mktoken.py --role 1 --user 7)       # sys_admin, real user id
TOKEN=$(scripts/mktoken.py --role 77)               # role with no permissions
TOKEN=$(scripts/mktoken.py --role 2 --hours -1)     # expired
```

Signs HS256 with the `JWT_SECRET` from `computation.server.go/.env.development`
— the same secret `devserver.sh` gives the server, so tokens verify. Claims
mirror the Node backend's UserJWT (`id`, `role_id`, `org_id` as strings).
Defaults: user 999999 (nonexistent — fine for auth/permission tests, use a
real `--user` for asset-access tests), org 1, 1 hour expiry.

## Query the dev database

```sh
scripts/dbquery.sh "SELECT role_id, perm_key FROM app.role_permissions_view WHERE perm_key = 'report.view'"
scripts/dbquery.sh "SELECT count(*) FROM app.telemetry WHERE asset_id = 12 AND happened_at > now() - interval '1 day'"
```

Rows print tab-separated with a header; row count and command tag go to
stderr. Non-SELECT statements work too (used for seeding), so be deliberate —
this is the shared dev database, not a sandbox.

## Typical smoke sequence

```sh
scripts/devserver.sh start
TOKEN=$(scripts/mktoken.py --role 2)

curl -s -w " -> %{http_code}\n" http://localhost:4404/compute/health
curl -s -w " -> %{http_code}\n" -X POST http://localhost:4404/compute/reports/activity                                   # 401
curl -s -w " -> %{http_code}\n" -X POST -H "Authorization: Bearer $(scripts/mktoken.py --role 77)" \
     http://localhost:4404/compute/reports/activity                                                                      # 403
curl -s -w " -> %{http_code}\n" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"asset_uuid":"...","from":"2026-07-12T00:00:00Z","to":"2026-07-12T23:59:59Z"}' \
     http://localhost:4404/compute/reports/activity

scripts/devserver.sh stop
```

Expected statuses per phase are in `computation.server.go/ROADMAP.md`
(Step 10's acceptance matrix is the full list).

## Notes

- Tokens minted here are real, verifiable credentials for the dev secret.
  They belong in shell variables, never in committed files or docs.
- If the server won't start, `devserver.sh` prints the log tail; the two
  usual causes are the remote DB being unreachable and a stale process
  already holding the port (`devserver.sh status`, then `stop`).
- `RUN_DB_TESTS=1 go test ./internal/repository` (integration tests) needs
  `DB_URL` exported the same way — steal it from one line:
  `DB_URL=$(grep '^DB_URL' computation.server.go/.env | cut -d'"' -f2 | sed 's|127.0.0.1|57.129.22.122|')`
