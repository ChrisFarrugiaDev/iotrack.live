#!/usr/bin/env bash
# Run computation.server.go against the remote dev database.
#
#   devserver.sh start    build the binary, boot it, wait for /compute/health
#   devserver.sh stop     SIGTERM via pidfile, wait for graceful shutdown
#   devserver.sh status   pid + health check
#   devserver.sh log      tail the server log
#
# Builds a real binary instead of `go run` so stop kills the server itself,
# not a go-run parent whose child survives. Overrides:
#   HTTP_PORT       listen port            (default 4404, avoids prod's 4004)
#   REMOTE_DB_HOST  dev database host      (default 57.129.22.122)
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
SVC="$REPO_ROOT/computation.server.go"

RUN_DIR="${TMPDIR:-/tmp}/compute-dev-check"
PIDFILE="$RUN_DIR/server.pid"
LOGFILE="$RUN_DIR/server.log"
BIN="$RUN_DIR/computation-server"

HTTP_PORT="${HTTP_PORT:-4404}"
REMOTE_DB_HOST="${REMOTE_DB_HOST:-57.129.22.122}"
HEALTH_URL="http://localhost:$HTTP_PORT/compute/health"

running_pid() {
    [ -f "$PIDFILE" ] || return 1
    local pid
    pid=$(cat "$PIDFILE")
    kill -0 "$pid" 2>/dev/null || return 1
    echo "$pid"
}

env_value() { # env_value FILE KEY
    grep "^$2" "$1" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}

case "${1:-}" in
start)
    if pid=$(running_pid); then
        echo "already running (pid $pid) on port $HTTP_PORT"
        exit 0
    fi
    mkdir -p "$RUN_DIR"

    # .env points at 127.0.0.1 because in production the DB is on the same
    # box; swap the host so the local process reaches the remote dev DB.
    DB_URL=$(env_value "$SVC/.env" DB_URL | sed "s|127.0.0.1|$REMOTE_DB_HOST|")
    JWT_SECRET=$(env_value "$SVC/.env.development" JWT_SECRET)
    [ -n "$DB_URL" ] || { echo "DB_URL not found in $SVC/.env" >&2; exit 1; }
    [ -n "$JWT_SECRET" ] || { echo "JWT_SECRET not found in $SVC/.env.development" >&2; exit 1; }

    (cd "$SVC" && GOCACHE="${GOCACHE:-/tmp/gocache}" go build -o "$BIN" ./cmd/app)

    HTTP_PORT="$HTTP_PORT" DB_URL="$DB_URL" JWT_SECRET="$JWT_SECRET" DOCKERIZED=true \
        nohup "$BIN" > "$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"

    for _ in $(seq 1 30); do
        if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
            echo "up (pid $(cat "$PIDFILE")) -> $HEALTH_URL"
            exit 0
        fi
        sleep 0.5
    done
    echo "server did not become healthy; last log lines:" >&2
    tail -20 "$LOGFILE" >&2
    exit 1
    ;;
stop)
    if ! pid=$(running_pid); then
        echo "not running"
        rm -f "$PIDFILE"
        exit 0
    fi
    kill -TERM "$pid"
    for _ in $(seq 1 20); do
        kill -0 "$pid" 2>/dev/null || { echo "stopped (pid $pid)"; rm -f "$PIDFILE"; exit 0; }
        sleep 0.5
    done
    echo "graceful shutdown timed out, sending SIGKILL" >&2
    kill -KILL "$pid" 2>/dev/null || true
    rm -f "$PIDFILE"
    ;;
status)
    if pid=$(running_pid); then
        echo "running (pid $pid)"
        curl -s "$HEALTH_URL" && echo
    else
        echo "not running"
    fi
    ;;
log)
    tail -40 "$LOGFILE"
    ;;
*)
    echo "usage: devserver.sh {start|stop|status|log}" >&2
    exit 1
    ;;
esac
