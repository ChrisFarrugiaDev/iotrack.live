#!/usr/bin/env bash
# Run one SQL statement against the remote dev database (no local psql).
#
#   dbquery.sh "SELECT count(*) FROM app.telemetry WHERE asset_id = 12"
#   dbquery.sh "INSERT INTO ... ON CONFLICT DO NOTHING"
#
# DB_URL comes from computation.server.go/.env with the host swapped to the
# dev box, same as devserver.sh. Override host with REMOTE_DB_HOST.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(git rev-parse --show-toplevel)
SVC="$REPO_ROOT/computation.server.go"
REMOTE_DB_HOST="${REMOTE_DB_HOST:-57.129.22.122}"

[ $# -eq 1 ] || { echo "usage: dbquery.sh <sql>" >&2; exit 1; }

DB_URL=$(grep '^DB_URL' "$SVC/.env" | head -1 | cut -d= -f2- | tr -d '"' | sed "s|127.0.0.1|$REMOTE_DB_HOST|")

cd "$SCRIPT_DIR/dbquery"
DB_URL="$DB_URL" GOCACHE="${GOCACHE:-/tmp/gocache}" go run . "$1"
