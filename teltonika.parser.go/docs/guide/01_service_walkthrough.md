# Service Walkthrough — from `main.go` outward

> Start here. This file explains what the service is, how it boots, and what
> keeps running afterwards. The deep dives:
> **[02_tcp_parser_flow.md](02_tcp_parser_flow.md)** (the TCP hot path),
> **[03_codec_parsers.md](03_codec_parsers.md)** (byte-level parsing),
> **[04_infra_branches.md](04_infra_branches.md)** (background branches +
> Redis key catalog).

## What this service is

`teltonika.parser.go` is a TCP ingestion service for Teltonika GPS trackers.
A device opens a raw TCP socket and streams binary packets. The service
identifies the device, parses the packets, and sends the telemetry onward.

Telemetry goes out **two ways**:

- to **RabbitMQ**, where `telemetry.db.writer.node.ts` stores it in Postgres
  (the durable path)
- to **Redis pub/sub** on the `teltonika:live` channel, where the Socket.IO
  gateway pushes it to the browser (the live path)

The service also handles **Codec 12 commands** (send a command to a device,
wait for its reply, mark it completed or failed), and keeps device and
organisation metadata cached in memory so the hot path never touches Postgres.

The mental model: **one hot path** (TCP in → parse → fan out) plus a few
**background branches** that keep shared state fresh and durable.

---

## The shared state: `appcore.App`

Everything in the service reads and writes one shared `App` struct.
(`app.go ref:001`)

Its fields fall into four groups:

**Connections to the outside world**

- `Cache` — the Redis pool (keys get the `teltonika.parser.go:` prefix)
- `MQProducer` — the RabbitMQ producer
- `DB` / `Models` — the Postgres pool and the data-access layer

**In-memory caches** (so the hot path never queries Postgres)

- `Devices` — IMEI → device, guarded by `DevicesLock`
- `Organisations` — orgID → organisation, guarded by `OrganisationsLock`

**Latest-telemetry state** (all guarded by `LatestTelemetryLock`, except
`LastTsMap` which has its own `LastTsLock`)

- `LastTsMap` — the newest telemetry timestamp seen per device (for dedup)
- `LastTelemetryMap` — the latest merged telemetry record per device
- `UpdatedDevices` — the set of devices that changed since the last flush

**Plumbing**

- `PubCh` — send-only channel into the Redis publisher goroutine
- `UUID` — uuid7 generator, used when creating new devices
- `Cron` — the scheduler that runs the telemetry flush

Why two kinds of locks: `Devices` is read on every packet but only rewritten
by the sync branch, so a read/write lock (`RWMutex`) lets many readers in at
once. The latest-telemetry maps are written from many directions at the same
time, so they use a plain `Mutex`.

---

## Boot sequence

`main()` wires everything up in a fixed order. Dependencies come first (cache,
queue, database), then the caches are warmed, and only then do the things that
*produce* work (cron, TCP server) start.

1. `initializeAppCore` — allocate the maps, locks, UUID generator, and cron
   on the `App` struct. (`main.go ref:002`)
2. `loadEnv()` — set `TZ=UTC` and load `.env` / `.env.development`, unless
   running in Docker. (`settings.go ref:003`)
3. `logger.InitLogger()` — set up the Zap logger. (`main.go ref:004`)
4. `initializeCache()` — build the Redis pool. (`settings.go ref:005`)
5. Load `rabbitmq_config.json` and start the RabbitMQ producer in the
   background — it connects and reconnects on its own. (`main.go ref:006`)
6. `initializeDatabase()` — open the Postgres pool and build the models.
   (`settings.go ref:007`)
7. `StartPublisher()` — start the Redis publisher goroutine and keep its
   send-only channel as `app.PubCh`. (`main.go ref:008`)
8. Create the shutdown context: `signal.NotifyContext` gives a `ctx` that
   cancels on `SIGINT`/`SIGTERM`. Every branch receives this `ctx`.
   (`main.go ref:009`)
9. `startSyncRoutines` — run the first DB → Redis → memory sync so the
   caches are warm before any packet arrives, then start the periodic sync
   goroutines. (`main.go ref:010`)
10. `setupCrons()` — register the telemetry-flush job and start the
    scheduler. (`main.go ref:011`)
11. Start the TCP server in its own goroutine. (`main.go ref:012`)
12. Block on `<-ctx.Done()` until a shutdown signal arrives. (`main.go ref:013`)

---

## The branches that keep running

After boot, a few goroutines run for the life of the process. Each one reads
or writes the shared `App` state above.

**TCP server** — the hot path. One goroutine per connected device: parse the
packets, answer the device, fan out the telemetry.
See [02_tcp_parser_flow.md](02_tcp_parser_flow.md).

**Device & organisation sync** — two loops. DB → Redis every **1 minute**,
Redis → memory every **20 seconds**. This is what keeps `App.Devices` fresh
without the hot path ever touching Postgres.
See [04_infra_branches.md](04_infra_branches.md), "Device & organisation sync".

**Telemetry-flush cron** — every ~10 seconds, writes the latest per-device
telemetry from memory into Redis as durable "last known state".
See [04_infra_branches.md](04_infra_branches.md), "Latest-telemetry state & flush".

**Redis publisher** — drains `app.PubCh` and publishes each live message to
the `teltonika:live` channel.
See [04_infra_branches.md](04_infra_branches.md), "Redis pub/sub publisher".

**RabbitMQ producer** — keeps the connection alive (auto-reconnect); the hot
path just calls `SendDirectMessage` on it.
See [04_infra_branches.md](04_infra_branches.md), "RabbitMQ producer".

---

## A packet's journey (end to end)

This is the story worth being able to tell out loud: one telemetry packet,
from the wire to the browser and the database.

1. Bytes arrive on the device's TCP connection; the read loop hands them to
   `handleTcpData`. (`server.go ref:014`)

2. The **first packet is the IMEI handshake** (17 bytes). The device is looked
   up in `App.Devices` — or created in Postgres and cached if it's new — and
   the server ACKs with `0x01`. (`handler.go ref:015`)

3. Every packet after that is **data**. The codec ID at byte 8 picks the
   parser: Codec 8 / 8 Extended is telemetry, Codec 12 is a command response.
   (`handler.go ref:016`)

4. **Codec 12 bookkeeping** — if a command is inflight or pending for this
   device, the handler completes it, retries it, or sends the next one.
   (`handler.go ref:017`)

5. The device gets a reply: either a staged Codec 12 command **or** the 4-byte
   record-count ACK — never both. (`handler.go ref:018`)

6. Each telemetry record is flattened and published to RabbitMQ
   (`teltonika_telemetry`). For the *newest* record only, the handler checks
   `LastTsMap` (is this actually newer?), merges it into `LastTelemetryMap`,
   and pushes it onto `PubCh` for the `teltonika:live` channel.
   (`handler.go ref:019`)

7. Every ~10 seconds the cron flush snapshots the changed devices and writes
   their latest telemetry to Redis. (`telemetry_service.go ref:020`)

8. Downstream, `telemetry.db.writer.node.ts` consumes the RabbitMQ messages
   and `socketio.gateway.node.ts` consumes `teltonika:live`.

So one packet can produce: a reply to the device, N durable RabbitMQ
messages, one live pub/sub message, and (a little later) one Redis snapshot
write.

---

## Shutdown

When `SIGINT`/`SIGTERM` arrives, the `ctx` cancels, `main` unblocks, and the
service tears down in reverse order. (`main.go ref:013`)

1. Wait for the TCP server to stop (5-second timeout).
2. Stop the Redis publisher — close `PubCh` and let it drain.
3. Close Redis, then RabbitMQ, then Postgres.
4. Stop the cron and wait for any running flush to finish.
5. Flush the logger.

The order matters: stop taking new work first (TCP), then close the sinks it
was writing to, and let in-flight jobs finish so nothing is lost mid-write.
