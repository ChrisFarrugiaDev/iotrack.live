# Infra Branches — sync, flush, Redis pub/sub, RabbitMQ

> Part of the guide. Start at **[01_service_walkthrough.md](01_service_walkthrough.md)**
> for the whole-service picture. The TCP hot path that *produces* the work these
> branches carry is in **[02_tcp_parser_flow.md](02_tcp_parser_flow.md)**.

These are the background branches that run alongside the TCP hot path. They keep
the in-memory caches fresh and move data into the durable and live sinks.

One thing to know up front — every Redis key uses one of two prefixes:

- `teltonika.parser.go:` — state **owned by this parser** (commands, latest
  telemetry)
- `iotrack.live:` — **shared** app state (devices, organisations) that other
  services also read

---

## Device & organisation sync

The parser never reads Postgres on the hot path. Instead, device and
organisation metadata flows through three tiers:

```
PostgreSQL (source of truth)
     │  DB → Redis, every 1 minute
     ▼
Redis hash  iotrack.live:devices  /  iotrack.live:organisations
     │  Redis → memory, every 20 seconds
     ▼
in-memory  App.Devices  /  App.Organisations   ← the hot path reads this
```

Why three tiers: Postgres is the truth but too slow to hit per packet. The
Redis hash is the cross-service contract — the backend reads and writes devices
there too. The in-memory map is what the TCP handler reads, under a read lock,
on every single packet.

### DB → Redis

`SyncDevicesFromDBToRedis` reads all `teltonika` devices from Postgres and
replaces the whole Redis hash in one **atomic** step, using a Lua script
(`ReplaceDeviceHashWithLua`). Atomic matters: readers never see a half-written
hash.
(`device_service.go ref:041`)

### Redis → memory

`SyncDevicesFromRedisToVar` does a `HGETALL`, unmarshals each device (with
`NormalizeIDs` fixing up JSON number types), and swaps the whole `App.Devices`
map under the write lock.
(`device_service.go ref:042`)

Organisations follow the exact same shape, into `iotrack.live:organisations`
and `App.Organisations`. This hash is also the maps/AI-key inheritance contract
shared with the backend.
(`organisation_service.go ref:043`)

### Seeding the timestamp map

At startup, `BuildDeviceTsMap` fills `LastTsMap` with each device's
`LastTelemetryTs` from the database. This is what lets the hot path drop
out-of-order or replayed old records from the very first packet after a
restart.
(`device_service.go ref:044`)

### The two loops

Both loops are plain goroutines with a ticker: DB → Redis every **1 minute**,
Redis → memory every **20 seconds**. Both watch the shutdown context and exit
when it cancels.
(`main.go ref:045`)

---

## Latest-telemetry state & flush

The service keeps each device's **latest** telemetry merged in memory, and a
cron job periodically persists it to Redis as durable "last known state".

### Updating (hot path side)

`UpdateLastTelemetry` is called from the TCP handler for the newest record in a
packet, under `LatestTelemetryLock`.
(`telemetry_service.go ref:046`)

It does three things:

- drops the update if the stored timestamp is already newer or equal (dedup)
- merges field-by-field into `LastTelemetryMap` — it keeps the last-known GPS
  position if the new record has zeroed coordinates, and merges the `Elements`
  map key-by-key
- marks the device dirty by adding its ID to the `UpdatedDevices` **set** —
  many updates between flushes collapse to one entry

### Flushing (cron side)

`FlushLastTelemetry` runs on the cron and uses **double-buffering** so it never
holds the lock while talking to Redis.
(`telemetry_service.go ref:020`)

1. Under the lock, grab `UpdatedDevices` and immediately replace it with a
   fresh empty set. New writers accumulate into the new set; the swap itself is
   instant.
2. Still under the lock, `DeepCopy` each dirty device's record. The copy is
   needed because `Elements` is a map (a reference type) — a plain struct copy
   would share the pointer, and a concurrent update could mutate it mid-marshal.
3. Release the lock, then write each snapshot to
   `device-latest-telemetry:{deviceID}` and add the IDs to the
   `device-latest-telemetry:id` set.

The schedule comes from `LATEST_TELEMETRY_FLUSH_CRON` — our `.env` sets it to
every 10 seconds (`0,10,20,30,40,50 * * * * *`); the code default is every 20.
The job is wrapped in `recover()` so a panic can't kill the scheduler.
(`cron_jobs.go ref:047`)

---

## Redis pub/sub publisher

This is the live path. `StartPublisher` launches one background goroutine and
returns a **buffered send-only channel** (buffer size **2000**) that main stores
as `app.PubCh`, plus a stop function.
(`redis_publisher.go ref:048`)

The hot path sends `PubMsg{Channel, Payload}` onto the channel; the goroutine
ranges over it and runs `PUBLISH` for each message. On a publish error it
reconnects once and retries, so a dropped Redis connection doesn't kill the
goroutine.

`stop()` closes the channel and waits for the goroutine to drain and exit —
this is what graceful shutdown calls right after the TCP server stops.

Messages go to the `teltonika:live` channel, consumed by
`socketio.gateway.node.ts` and forwarded to the browser. The payload is the
same JSON telemetry record that goes to RabbitMQ — it is not wrapped again.

---

## RabbitMQ producer

This is the durable path. The topology (exchanges, queues, routing keys) comes
from `rabbitmq_config.json`. `Run` connects with a retry loop, then
`monitorConnection` watches for closures and reconnects automatically.
(`producer.go ref:049`)

The hot path calls `SendDirectMessage(routingKey, exchange, message)`, which
publishes persistent JSON. It validates that the routing key exists and matches
the exchange, and no-ops safely if the channel isn't up yet — a RabbitMQ outage
never crashes the parser.
(`producer.go ref:050`)

Each telemetry record goes to exchange `teltonika` with routing key
`teltonika_telemetry`, consumed by `telemetry.db.writer.node.ts` for durable
inserts.

The message shape, built in `handler.go`:

```json
{
  "device_id": 123,
  "asset_id": 456,
  "organisation_id": 789,
  "happened_at": "2026-07-07T12:34:56Z",
  "protocol": "4G",
  "vendor": "teltonika",
  "telemetry": { "timestamp": ..., "latitude": ..., "elements": { ... } }
}
```

---

## Redis key catalog

Everything this service keeps in Redis, in one place:

| Key | Type | Prefix | Written by | Purpose |
|-----|------|--------|-----------|---------|
| `devices` | Hash | `iotrack.live:` | device sync | all teltonika devices by IMEI (shared) |
| `organisations` | Hash | `iotrack.live:` | org sync | all orgs by ID (shared, maps/AI keys) |
| `codec12:pending-commands:{imei}` | List | `teltonika.parser.go:` | backend enqueues | queued commands for a device |
| `codec12:inflight-commands:{imei}` | String | `teltonika.parser.go:` | `SetToInflight` | the command awaiting a reply |
| `codec12:sync-commands` | Hash | `teltonika.parser.go:` | `SetToSync` | completed/failed commands for the DB writer |
| `device-latest-telemetry:{id}` | String | `teltonika.parser.go:` | telemetry flush | latest snapshot per device |
| `device-latest-telemetry:id` | Set | `teltonika.parser.go:` | telemetry flush | set of device IDs with telemetry |

The pub/sub channel `teltonika:live` is not a stored key — it's a
fire-and-forget `PUBLISH` target.
