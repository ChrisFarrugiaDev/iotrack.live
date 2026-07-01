# Teltonika Replay Parser Service Spec

`teltonika.replay.go` reads historical Teltonika raw-packet CSV files, replays
each device's Codec 8 telemetry on a wall-clock schedule as if it were arriving
live, and forwards the resulting state to the rest of `iotrack.live` using the
**exact same downstream contracts** as the live `teltonika.parser.go` service
(RabbitMQ telemetry, Redis live pub/sub, Redis latest telemetry, device/org
sync).

It is a **dummy / simulation** service derived from `teltonika.parser.go`. It
contains **no TCP server, no IMEI handshake, no ACK/NACK, no Codec 8 Extended,
and no Codec 12 command lifecycle.** The only input is the gzipped CSV history;
the only outputs are the same RabbitMQ and Redis writes the live parser
produces.

---

## 1. Service Identity

| Property | Value |
|----------|-------|
| Module | `iotrack.live/teltonika.replay.go` |
| Language | Go 1.23.1 |
| Binary | `teltonika-replay` |
| Role | Replays historical Teltonika Codec 8 packets from CSV as live telemetry |
| Part of | `iotrack.live` platform (fleet/asset tracking SaaS) |
| Input | Daily gzipped CSV files of raw hex packets |
| Output | RabbitMQ telemetry, Redis pub/sub live updates, Redis latest telemetry |
| Removed vs parser | TCP server, IMEI handshake, ACK/NACK, Codec 8 Extended, Codec 12 |

---

## 2. Service Role

This service is responsible for:

- Loading one gzipped CSV history file per replay day.
- Decompressing in a streaming fashion (no full-file-in-memory requirement).
- Grouping rows by device IMEI (the second CSV column), filtered to an `.env`
  IMEI whitelist so only the listed devices are loaded and replayed.
- Looking up known devices from in-memory state backed by Redis/PostgreSQL.
- Creating unknown devices with vendor `teltonika` and status `new`
  (IMEI taken from the CSV column, **not** from a handshake).
- Parsing Codec 8 (`0x08`) packets only.
- Computing a single per-day **time offset** so that historical packets appear
  to occur "today," preserving intra-day spacing.
- Replaying each device's packets concurrently, on a wall-clock schedule that
  fires each packet at `happened_at + offset`.
- Rewriting every parsed record's timestamp by the same offset before
  publishing.
- Publishing telemetry to RabbitMQ for durable storage (same contract).
- Publishing latest telemetry to Redis for live Socket.IO forwarding (same
  channel and payload).
- Flushing latest telemetry to Redis (same keys).
- Advancing to the next day's CSV file automatically, and wrapping back to the
  start file after a configured number of days.

This service is **NOT** responsible for:

- Any TCP networking or device-facing protocol behavior.
- Sending ACKs, NACKs, or Codec 12 commands.
- Parsing Codec 8 Extended (`0x8E`) or Codec 12 (`0x0C`).
- Consuming any Redis command queues.

---

## 3. Input Data Format

### 3.1 File naming and layout

- Files are gzipped CSV, one per calendar date:
  `raw_packets_<YYYY-MM-DD>.csv.gz`
  e.g. `raw_packets_2026-04-10.csv.gz`.
- All files live in a single directory configured by `REPLAY_DATA_DIR`.
- Decompressed content is a CSV. A leading **header row may be present** — the
  real exported dataset begins with `happened_at,imei,raw_data`. The loader does
  **not** special-case it: with a whitelist active the header's IMEI column
  (`imei`) is not a whitelisted value and is dropped at the filter step; with an
  empty, non-required whitelist it fails timestamp parsing and is skipped as a
  malformed row (logged once at `warn`). Either way it never reaches the parser.

#### Storage location (decided)

- Files are kept on a **local disk / attached volume on the OVH host**, in
  `REPLAY_DATA_DIR`. No object storage (S3) is used.
- Rationale: a single replay service, on a single box, reads exactly one file
  per day (known an hour ahead via preload). The files are disposable —
  re-uploaded if the box is rebuilt. This access pattern gains nothing from
  object storage and avoids an SDK, credentials, network calls in the hot path,
  and egress costs. The loader simply `os.Open`s a local path.
- Dataset scale: ~245 files, ~25–40 MB each compressed (~6–10 GB total),
  ~200–300 MB each uncompressed. Files are kept **gzipped on disk** and
  stream-decompressed at load (§3.3), so peak memory is the ~30 MB compressed
  reader plus only the decoded bytes for whitelisted devices — never the full
  uncompressed file.
- Recommended: mount an **OVH Block Storage volume** at `REPLAY_DATA_DIR` (easy
  to resize/snapshot/detach), though the instance's root disk is also sufficient
  for a re-uploadable dataset. Initial upload via `rsync -avz` (resumable).
- If the deployment assumptions change later (multiple instances, or files that
  must survive host loss), migrate to OVH Object Storage (S3-compatible,
  same-provider to avoid egress) — the loader would gain an S3 fetch step in
  front of decompression, but no other part of the spec changes.

### 3.2 Row format

Each row has three columns separated by `REPLAY_CSV_DELIMITER` (default tab
`\t`). The real exported dataset is **comma-delimited**, so deployments using it
set `REPLAY_CSV_DELIMITER=,`:

| Column | Example | Meaning |
|--------|---------|---------|
| 1 — `happened_at` | `2026-04-10 00:00:00+00` | Original UTC timestamp the packet was received |
| 2 — `imei` | `864275075775927` | Device IMEI (replaces the TCP handshake identity) |
| 3 — `raw_packet` | `000000000000005808...d895` | Full Codec 8 packet, hex-encoded |

Notes:

- Column 1 is parsed as RFC3339-ish UTC (`2006-01-02 15:04:05-07`). The
  `+00` suffix means UTC.
- Column 3 is the **entire** Teltonika TCP data packet (preamble through CRC),
  exactly as it would have arrived on the socket — so the existing Codec 8
  parser can consume it unchanged after hex decode.
- Rows within a file are ordered ascending by `happened_at` but the service
  MUST NOT rely on global ordering; it sorts per device after grouping.

### 3.3 Reading strategy

- Open file, wrap in `gzip.NewReader`, wrap in a buffered CSV scanner.
- Stream rows. For each row, in this order:
  1. Read column 2 (IMEI) as plain text.
  2. **Whitelist check (§3.4):** if the IMEI is not in the whitelist, skip the
     row immediately — before hex-decoding column 3 or allocating anything.
  3. Only for whitelisted IMEIs: hex-decode column 3 once and group by IMEI.
- Malformed rows (bad timestamp, odd-length hex, empty IMEI) are logged at
  `warn` and skipped; they do not abort the day.

### 3.4 IMEI whitelist

The set of devices to replay is fixed by an `.env` whitelist:

- `REPLAY_IMEI_WHITELIST` — comma-separated list of IMEIs, e.g.
  `864275075775927,864275076484925,864636069136725`.
- Read **once at startup** from `.env` and held in memory as a
  `map[string]struct{}` for O(1) lookup. The value does not change while the
  process runs; **to change the whitelist, restart the service** (consistent
  with all other env vars).
- The whitelist is **applied on every file load** — each day's CSV is filtered
  against it as the file streams in. So the list is fixed, but the filtering
  happens every day, on every reload, at init and thereafter.
- **Only whitelisted IMEIs are ever held in memory.** Rows for any other device
  are dropped at the filter step (before hex decode), so a file containing
  thousands of devices costs the same memory as the whitelist size. With N
  IMEIs listed, exactly N per-device goroutines run (§5.2).
- If `REPLAY_IMEI_WHITELIST` is empty or unset, behavior is governed by
  `REPLAY_WHITELIST_REQUIRED`:
  - `true` (default): empty whitelist = replay **nothing**; log at `warn`.
    This is the safe default — it prevents accidentally replaying the entire
    historical fleet.
  - `false`: empty whitelist = replay **all** devices in the file (the original
    "no filter" behavior).
- Each whitelisted IMEI is still resolved against `app.Devices` (§7.1). An IMEI
  in the whitelist that does not exist as a device follows the normal unknown-
  device path (create with `status=new`) — though for retired-fleet replay these
  should already exist. Optionally, log at `warn` if a whitelisted IMEI is not
  found in `app.Devices` at load time.


---

## 4. Time Shifting Model

The core behavioral requirement: historical data must be replayed as though it
is happening **now**, with the same relative timing it had on its original day.

> **Everything in this service is UTC.** CSV input timestamps (`+00`), the
> offset math, the wall-clock scheduler, the midnight day-switch, and the
> published payload timestamps are all computed and compared in UTC. The service
> never converts to or reasons about local time. Local timezone presentation
> (for end users / maps) is handled by downstream services, not here. This keeps
> the whole-day offset arithmetic exact, since UTC has no DST and every "day" is
> exactly 24h.

### 4.1 Per-day offset

When a day's file is loaded, compute one offset for the entire file:

```
file_date          = date parsed from the filename (YYYY-MM-DD), at 00:00:00 UTC
today_midnight     = current date in UTC, at 00:00:00 UTC
offset             = today_midnight - file_date          // a time.Duration
```

`offset` is a whole number of days (midnight-to-midnight), matching the
described behavior: if the file date is `2025-08-15` and today is `2026-07-27`,
the offset is `29,894,400` seconds (346 days). Every packet for that day is
shifted by exactly this amount.

> Rationale: shifting by a whole-day, midnight-anchored offset preserves each
> packet's time-of-day and the spacing between packets, so a packet originally
> at `00:01:05` replays 65 seconds after the `00:00:00` packet, but now dated
> today.

### 4.2 Applying the offset

The offset is applied in two places, and they must stay consistent:

1. **Scheduling** — a packet whose original `happened_at` is `H` is dispatched
   when wall-clock `now_UTC >= H + offset`.
2. **Payload timestamps** — after parsing, every record's `timestamp` /
   `happened_at` field is rewritten to `original + offset` before it is
   published to RabbitMQ, written to Redis latest telemetry, or pushed to the
   live pub/sub channel. Downstream services therefore see "today's" timestamps
   and the `LastTsMap` dedup logic continues to work.

### 4.3 Timestamp adjustment detail

The Codec 8 packet embeds an 8-byte Unix-ms timestamp per AVL record. Two
equivalent strategies are permitted; the service uses **strategy A**:

- **Strategy A (post-parse rewrite, default):** parse the packet normally, then
  add `offset` to each parsed record's millisecond timestamp and to the derived
  `happened_at` string. The raw hex is never mutated. This is simpler and keeps
  CRC handling untouched.
- **Strategy B (pre-parse rewrite):** not used. Mutating the embedded timestamp
  would invalidate the packet CRC and require recompute; avoided.

Because Strategy A is used, **CRC validation still runs against the original
unmodified bytes** (see §7.3).

---

## 5. Replay Scheduling Model

### 5.0 Load-time vs fire-time split (core principle)

Work is divided into two phases so that parsing/publishing is spread across the
day on the original timeline — mirroring how the live parser sees packets arrive
over TCP, rather than processing a whole day at once.

**At load time (preload, ~1h before midnight):**
- Stream the file, filter to the whitelist, hex-decode column 3,
  group by IMEI, and sort each device's slice by `happened_at`.
- The result is the in-memory `ReplayDay`: only whitelisted devices, each a
  slice of `ReplayPacket{ IMEI, HappenedAt, Raw []byte }` ordered ascending.
- **No Codec 8 parsing, no CRC check, no publishing happens here.** Only the raw
  decoded bytes are held, grouped and ordered.

**At fire time (per packet, when `now_UTC >= happened_at + offset`):**
- The device goroutine runs the Codec 8 parser on that one packet, validates
  CRC, applies the offset to the timestamps, runs `LastTsMap` dedup, builds the
  `FlatAvlRecord`, and publishes to RabbitMQ + Redis + pub/sub.

This is the direct analogue of the live parser: there, packets arrive
drip-fed over TCP and are parsed on arrival; here, the same drip-feed is
reconstructed from `happened_at + offset`, so downstream sees the same load
profile, ordering, and dedup behavior. Memory holds only the raw bytes for the
whitelisted devices (§3.4); the parsing cost is amortized across the day, not
paid all at once on load.

### 5.1 Day lifecycle

```
1. Determine the active file for the current replay day (see §6).
2. Decompress + stream rows; filter each row against the IMEI whitelist (§3.4)
   before hex-decoding; group surviving rows by IMEI into
   map[string][]ReplayPacket.
3. Sort each device's slice ascending by happened_at.
4. Compute the per-day offset (§4.1).
5. For each whitelisted IMEI present in the file, launch one replay goroutine
   (concurrent per device).
6. Each goroutine walks its sorted packets, sleeping until each packet's
   scheduled wall-clock time (happened_at + offset), then processes it.
7. At the next UTC midnight tick, stop the day's goroutines and switch to the
   next file (§6).
```

### 5.2 Per-device goroutine

- One goroutine per **whitelisted** IMEI => natural concurrency across devices,
  mirroring the live parser's goroutine-per-connection model. With N IMEIs in
  `REPLAY_IMEI_WHITELIST`, at most N goroutines run (fewer if some whitelisted
  IMEIs have no rows in the current file). No memory or goroutine is spent on
  non-whitelisted devices.
- Within a device, packets are processed strictly in `happened_at` order so the
  per-device timestamp monotonicity (and `LastTsMap` dedup) holds.
- Scheduling primitive: compute `wait = (happened_at + offset) - now_UTC`; then,
  with a small fixed **grace window** `fireGrace` (1s, §5.2.1):
  - `wait > 0` — sleep (interruptible via context) then process.
  - `-fireGrace <= wait <= 0` — process **immediately** (scheduled time just
    passed; this is boundary jitter, not catch-up).
  - `wait < -fireGrace` — the packet is genuinely past-due (e.g. on a mid-day
    startup); **skip it** and move to the next one.

#### 5.2.1 Fire grace window (boundary jitter only)

- `fireGrace` is a fixed **1 second** tolerance applied to the skip decision
  above. A packet whose scheduled time is at most `fireGrace` in the past still
  fires; a packet more than `fireGrace` in the past is skipped.
- **Purpose: it absorbs the few milliseconds of timer + goroutine-launch jitter
  at the UTC midnight switch**, so the freshly-activated day's `00:00:00` packet
  is not dropped a hair late. It reconciles the strict "skip past-due" rule
  (§5.2 / §5.4) with the "replay in full from midnight" guarantee (§6.3).
- The window is deliberately tiny: 1s cannot reintroduce mid-day catch-up —
  packets that are minutes or hours past (the morning's data on a 14:00 startup)
  are still well beyond `fireGrace` and remain skipped (§5.4). It only ever
  rescues packets scheduled essentially "now."
- The service still never sends a packet *before* its scheduled time.

### 5.3 Concurrency controls

- `REPLAY_MAX_CONCURRENT_DEVICES` (semaphore) bounds the **fire-time
  parse/publish work** running simultaneously, to avoid a resource burst when
  many devices fire at the same instant (e.g. the `00:00:00` packets at the
  midnight switch). It caps the concurrent fire-time work, **not** the number of
  living per-device goroutines — all N goroutines still exist and sleep between
  packets; the semaphore is only held around the parse+publish of a packet.
  Default `0` = unbounded.
- All device goroutines for a day are tracked by a `sync.WaitGroup` and an
  `errgroup`/context so shutdown cancels them cleanly.

### 5.4 Mid-day startup behavior (skip past-due packets)

- On startup, any packet whose scheduled wall-clock time
  (`happened_at + offset`) is already in the past is **skipped** — not sent.
- Each device goroutine walks its sorted packets, drops every packet whose
  scheduled time is `< now_UTC` at the moment of startup, and begins sending
  only from the first packet that is still in the future.
- Example: the service starts at 14:00. All packets dated before 14:00
  (the morning's data) are skipped entirely; sending begins with the first
  packet scheduled at or after 14:00 and continues on real-time pacing through
  the rest of the day.
- The service never sends a packet *before* its scheduled time, and never
  back-fills already-due packets. Past = dropped (beyond the `fireGrace` window,
  §5.2.1).
- At the next day boundary the next file is loaded and replayed **in full from
  its midnight start** (because the service is now running ahead of midnight,
  no packets are past-due at that point). The `fireGrace` window (§5.2.1)
  guarantees the `00:00:00` packet fires even if the switch lands a few
  milliseconds late.

---

## 6. Day Rotation, Loading, And Looping

Controlled by environment variables (§11):

- `REPLAY_START_FILE` — the file to begin from on app init, e.g.
  `raw_packets_2026-04-10.csv.gz`.
- `REPLAY_DAYS` — number of consecutive daily files to play before wrapping,
  e.g. `90`.
- `REPLAY_PRELOAD_LEAD` — how long before UTC midnight the next day's file is
  prepared in the background. Default `1h`.

### 6.1 When files are loaded

- **First file (init):** loaded synchronously at startup from
  `REPLAY_START_FILE`. Replay begins immediately under the mid-day skip rule
  (§5.4) — if the service starts after 00:00, the already-past packets for the
  current day are skipped.
- **Every subsequent file:** loaded **in the background `REPLAY_PRELOAD_LEAD`
  before UTC midnight** (default 23:00 UTC). "Loaded" means: decompress, parse,
  group by IMEI, sort per device, and compute the offset for the upcoming day —
  all done ahead of time so the prepared `ReplayDay` is sitting in memory ready
  to fire.
- **Switch trigger:** the prepared day becomes active **exactly at the UTC
  midnight tick (00:00:00)**. At that instant the previous day's goroutines are
  stopped and the new day's per-device goroutines start from midnight, so the
  new file replays in full from its 00:00:00 packet.

### 6.2 Daily cycle (steady state)

```
23:00 UTC (midnight - REPLAY_PRELOAD_LEAD):
    background-load next file -> prepared ReplayDay (decompress, group, sort, offset)

00:00:00 UTC (midnight tick):
    stop current day's goroutines
    activate prepared ReplayDay
    launch per-device goroutines from the midnight packet onward
    advance day_index
```

### 6.3 File selection and looping

```
start_date = date parsed from REPLAY_START_FILE
day_index  = 0

at each midnight tick:
    day_index    = (day_index + 1) mod REPLAY_DAYS
    current_date = start_date + day_index days
    file         = "raw_packets_" + current_date + ".csv.gz"
```

- Init begins at `REPLAY_START_FILE` (`day_index = 0`); the next day uses
  `raw_packets_<start+1>.csv.gz`, then `<start+2>`, and so on.
- After `REPLAY_DAYS` days, `day_index` wraps to `0` and the service restarts
  from `REPLAY_START_FILE`.
- Because the switch is midnight-anchored, the day's offset (§4.1) is always a
  clean whole-day value and the file replays start-to-finish from midnight
  (the only ever-partial day is the first one if the service boots mid-day).

### 6.4 Missing or bad files

- The preload step computes the next filename ahead of time. If that file is
  missing or unreadable at preload time, the service logs at `error` and, per
  `REPLAY_ON_MISSING_FILE` (`skip` | `halt`, default `skip`):
  - `skip`: advance `day_index` past the missing day at midnight (that day
    produces no telemetry).
  - `halt`: stop the replay loop and report the error.
- Detecting the problem at preload (≈1h early) rather than at midnight gives
  operational lead time to drop the file in before the switch.

---

## 7. Packet Processing Flow

This replaces the live parser's TCP handler. Per packet, per device goroutine:

### 7.1 Device resolution

- Look up IMEI (CSV column 2) in `app.Devices`.
- If not found: create a new device in PostgreSQL with
  - `external_id`: IMEI
  - `external_id_type`: `imei`
  - `vendor`: `teltonika`
  - `protocol`: `4G`
  - `status`: `new`
  then cache it in Redis hash `iotrack.live:devices` and add it to
  `app.Devices`. (Identical to the live parser's unknown-device path, minus the
  handshake trigger.)
- If status is `disabled` or `retired`: skip the device's packets (no error).

### 7.2 Codec dispatch

- Read codec ID from byte offset `8` of the decoded packet.
- **Only `0x08` (Codec 8) is supported.** Any other codec ID is logged at
  `warn` and the packet is skipped. (Codec 8 Extended and Codec 12 paths are
  removed.)

### 7.3 Parse + validate

- Hex-decode (already done at load time).
- Run the existing Codec 8 parser (`internal/teltonika/parse_codec_8.go`),
  which is reused **unchanged**.
- **CRC-16/IBM validation runs at fire time in the replay layer**, against the
  original unmodified bytes — computed over the data field (bytes `[8 : len-4]`,
  i.e. codec ID through the second quantity) with `util.Crc16IBM` and compared to
  the trailing 4-byte CRC. The original parser only *read* the CRC field without
  verifying it; the replay service adds the verification step without modifying
  `parse_codec_8.go`.
- The action on a CRC mismatch is configurable via `REPLAY_CRC_MODE`:
  - `reject`: drop the packet and log at `warn`.
  - `warn` (**default for now**): keep/publish the packet but log at `warn`.
    Rationale: the CSV is recorded real traffic that the live parser never
    CRC-checked, so `warn` is used first to confirm the historical packets
    actually pass before enforcing rejection. Flip to `reject` once verified.
- **Every CRC failure is logged with the device IMEI and the raw (hex) packet**,
  regardless of mode, so failing vectors can be inspected.

### 7.4 Timestamp adjustment + dedup

- Apply `offset` (§4.2) to each parsed record's timestamp and `happened_at`.
- Check `LastTsMap[device_id]`: reject records whose adjusted timestamp is not
  strictly newer than the last processed timestamp for that device (replay
  dedup safety, preserved from the parser).

### 7.5 Publish (identical contracts to live parser)

For each surviving AVL record:

- Build the `FlatAvlRecord` payload (§8) with **adjusted** timestamps.
- Publish JSON to RabbitMQ exchange `teltonika`, routing key
  `teltonika_telemetry` (queue `telemetry`), content type `application/json`,
  persistent delivery.
- Update `app.LastTelemetryMap[device_id]` and add to `app.UpdatedDevices`
  under `LatestTelemetryLock`.
- Publish the same JSON to Redis pub/sub channel `teltonika:live`.

No ACK is produced (there is no socket to ACK to).

### 7.6 Dry run (no-publish validation)

`REPLAY_DRY_RUN=true` runs the **entire** fire-time pipeline — codec dispatch,
Codec 8 parse, CRC validation, offset application, scheduling, and the mid-day
skip — but makes **no external writes**:

- No RabbitMQ publish, no Redis `teltonika:live` pub/sub, no latest-telemetry
  update (so the flush cron also writes nothing).
- No unknown-device creation: an IMEI absent from `app.Devices` is logged and
  skipped instead of being inserted into PostgreSQL / Redis.
- Each packet that would have been published is logged at `info`
  (`replay[dry-run]: would publish` with IMEI, device id, adjusted
  `happened_at`, and record count).

Purpose: because the service shares all contracts with the live parser on the
same infrastructure (§9, §9.1), dry run lets an operator confirm a replay loads,
parses, passes CRC, and schedules correctly — at real-time pacing — **before**
emitting any telemetry. Default is `false`; set it `true` for the first run
against shared infra, then flip it off once validated.

---

## 8. Telemetry Payload (unchanged contract)

The RabbitMQ JSON body keeps the live parser's `FlatAvlRecord` structure
exactly. Downstream `telemetry.db.writer.node.ts` must not need changes.

Top-level fields:

- `device_id`
- `asset_id`
- `organisation_id`
- `happened_at`   *(adjusted by offset)*
- `protocol`
- `vendor`
- `telemetry`

Nested `telemetry` object:

- `timestamp`    *(adjusted by offset)*
- `priority`
- `longitude`
- `latitude`
- `altitude`
- `angle`
- `satellites`
- `speed`
- `elements`     *(IO element name → value, from `IoElementsMap`)*

RabbitMQ contract:

- Exchange: `teltonika`
- Routing key: `teltonika_telemetry`
- Queue: `telemetry`
- Content type: `application/json`
- Consumer: `../telemetry.db.writer.node.ts`
- Delivery role: durable telemetry history (bulk insert into PostgreSQL
  `app.telemetry`).

The RabbitMQ body is the history contract. Keep field names stable unless the
parser and writer are changed together.

---

## 9. Latest Telemetry And Live Updates (unchanged contract)

In-memory state (same as parser):

- `app.LastTelemetryMap`  — device_id → latest `FlatAvlRecord`
- `app.LastTsMap`         — device_id → last adjusted timestamp (dedup)
- `app.UpdatedDevices`    — device_ids changed since last flush

Redis keys (same as parser):

- `teltonika.parser.go:device-latest-telemetry:<device_id>`  (String, JSON)
- `teltonika.parser.go:device-latest-telemetry:id`           (Set, index)

> The `teltonika.parser.go:` prefix is a **hardcoded literal** in the replay
> service (not built from MICROSERVICE_NAME, not renamed to `teltonika.replay.go:`
> despite the module rename). It is a Redis wire contract: the keys must stay
> byte-identical to what the live parser writes and existing consumers read.

> **Deployment model (decided):** the replay service runs on the **same shared
> infrastructure** as the live `teltonika.parser.go` (same Redis, RabbitMQ, and
> PostgreSQL), replays the **same real device IMEIs**, and reuses the **real
> downstream consumers** (`telemetry.db.writer.node.ts`,
> `socketio.gateway.node.ts`) unchanged. The Redis prefix, key names, RabbitMQ
> routing, and pub/sub channel are therefore kept **identical** to the parser —
> no `MICROSERVICE_NAME` override, no namespacing, no consumer edits.
>
> This is safe **only because the replayed devices are retired/offline** and are
> not transmitting live. There is thus no live parser writing to the same keys
> for the same IMEIs, so no collision occurs. See §9.1 for the safety
> precondition that must hold for this deployment to remain correct.

Live pub/sub:

- Channel `teltonika:live`, plain JSON `FlatAvlRecord`.
- Consumer `../socketio.gateway.node.ts/src/App.ts` emits `live-update` to
  Socket.IO room `device:<device_id>`.

Flush job:

- `FlushLastTelemetryJob` writes updated latest telemetry to Redis on the
  `LATEST_TELEMETRY_FLUSH_CRON` schedule (default every 20s), exactly as in the
  parser.

### 9.1 Shared-infra safety precondition

Because the replay service shares all infrastructure and contracts with the
live parser and replays the same real IMEIs, the following precondition MUST
hold for the deployment to be correct:

> **No replayed IMEI may be transmitting live at the same time the replay runs.**

If a real device were online while the replay sends historical data for the same
IMEI, both would write the same Redis `device-latest-telemetry:<id>` key, publish
to the same `teltonika:live` channel, and insert into the same `app.telemetry`
table — corrupting current state and history with no way to distinguish real from
replayed records.

The agreed deployment satisfies this because the replayed devices are
**retired/offline** (decommissioned, no longer transmitting). Operational
guards to preserve the precondition:

- Replay only IMEIs whose devices are in status `retired`/`disabled`, or are
  otherwise confirmed offline. (Optional: a startup check that skips any IMEI
  whose device status is `active`, logged at `warn`.)
- Do not point the replay service at a parser stack that is simultaneously
  receiving live traffic for the same fleet.

If, in future, replayed devices could be live, switch to the **namespaced
coexistence** model: add a `"source":"replay"` marker to `FlatAvlRecord`,
give replay its own Redis latest-key suffix and pub/sub channel, and update the
DB writer and gateway to route the marked stream. That path requires consumer
changes and is explicitly out of scope for this spec.

---

## 10. Device & Organisation Metadata Flow (unchanged)

Identical to the live parser:

Startup sync:

- PostgreSQL devices -> Redis hash `iotrack.live:devices` -> `app.Devices`
- PostgreSQL organisations -> Redis hash `iotrack.live:organisations` ->
  `app.Organisations`

Background sync goroutine periodically refreshes DB -> Redis -> memory (every
1 min / 20 sec as in the parser). Unknown IMEIs encountered during replay create
`status=new` devices (§7.1).

---

## 11. Startup Flow

Entrypoint: `cmd/replay/main.go`

```
1.  Initialize appcore.App state, locks, UUID generator, cron, and maps.
2.  Load environment variables unless DOCKERIZED=true.
3.  Initialize logger (zap + lumberjack).
4.  Connect to Redis. The cache prefix is the **hardcoded literal
    `teltonika.parser.go:`** — kept byte-identical to the live parser (it is NOT
    derived from MICROSERVICE_NAME and is NOT renamed to `teltonika.replay.go:`),
    so existing consumers read the same keys (§9).
5.  Load rabbitmq_config.json and start the RabbitMQ producer.
6.  Connect to PostgreSQL and initialize models.
7.  Start the async Redis publisher.
8.  Sync devices and organisations from PostgreSQL to Redis.
9.  Load devices and organisations from Redis into in-memory maps.
10. Build LastTsMap from device last telemetry timestamps.
11. Register cron jobs (latest telemetry flush; DB->Redis->memory sync).
12. Resolve REPLAY_START_FILE and REPLAY_DAYS; validate REPLAY_DATA_DIR.
13. Synchronously load REPLAY_START_FILE: decompress, group by IMEI, sort,
    compute offset. Launch per-device goroutines (§5), applying the mid-day
    skip rule (§5.4) if started after 00:00 UTC.
14. Schedule the day loop (§6): background-preload the next file at
    (midnight - REPLAY_PRELOAD_LEAD), and switch the active day at each UTC
    midnight tick, advancing/wrapping day_index per REPLAY_DAYS.
15. Block on OS signal (SIGINT/SIGTERM).
16. Graceful shutdown: cancel replay context (stop all device goroutines),
    stop cron, drain RabbitMQ producer, close Redis, close DB.
```

The TCP server start step from the parser is **removed**.

---

## 12. Environment

Inherited from the parser (unchanged meaning):

- `DOCKERIZED`
- `GO_ENV`
- `LOG_MODE`
- `LOG_FILE_PATH`
- `DEBUG`
- `LATEST_TELEMETRY_FLUSH_CRON`
- `MICROSERVICE_NAME`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_CACHE_EXPIRE`
- `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD`
- `DB_URL`, `DB_MAX_CONNS`, `DB_MIN_CONNS`, `DB_MAX_CONN_LIFETIME`,
  `DB_MAX_CONN_IDLE_TIME`

Removed (no TCP):

- `TCP_PORT`
- `TCP_TIMEOUT`

New (replay-specific):

| Variable | Example | Type | Purpose |
|----------|---------|------|---------|
| `REPLAY_DATA_DIR` | `./data` | string | Directory holding the `.csv.gz` files |
| `REPLAY_START_FILE` | `raw_packets_2026-04-10.csv.gz` | string | File to begin from on init |
| `REPLAY_DAYS` | `90` | int | Number of daily files to play before wrapping back to start |
| `REPLAY_IMEI_WHITELIST` | `864275075775927,864275076484925` | string | Comma-separated IMEIs to replay; only these are loaded into memory and given a goroutine. Read once at startup, applied on every file load. |
| `REPLAY_WHITELIST_REQUIRED` | `true` | bool | If `true` (default), an empty whitelist replays nothing. If `false`, an empty whitelist replays all devices in the file. |
| `REPLAY_CSV_DELIMITER` | `\t` | string | Column delimiter (`\t` default, or `,`) |
| `REPLAY_PRELOAD_LEAD` | `1h` | duration | How long before UTC midnight the next day's file is background-loaded (decompress + group + sort + offset) |
| `REPLAY_ON_MISSING_FILE` | `skip` | string | `skip` \| `halt` when the next file is missing at preload time |
| `REPLAY_MAX_CONCURRENT_DEVICES` | `0` | int | Semaphore bound on active device goroutines (`0` = unbounded) |
| `REPLAY_CRC_MODE` | `warn` | string | Action on a CRC-16/IBM mismatch: `reject` (drop + warn) or `warn` (log + keep, **default**). Every failure is logged with IMEI + raw packet regardless. |
| `REPLAY_DRY_RUN` | `false` | bool | When `true`, runs the full pipeline but makes **no external writes** — logs each fired packet instead of publishing (§7.6). Default `false`. |

> The day switch is always anchored to the **UTC midnight tick**; there is no
> speed multiplier. Replay runs at real time so each file plays across the same
> UTC time-of-day window it originally spanned. All timestamps — CSV input,
> offset math, scheduling, and published payloads — are **UTC**; local timezone
> presentation is handled by downstream services, not here.

Docker Compose service:

- `teltonika-replay-go`

---

## 13. Directory Structure (delta from parser)

Reused unchanged:

```
internal/appcore/app.go
internal/apptypes/codec_8_avl_record.go
internal/apptypes/flat_avl_record.go
internal/apptypes/meta.go            (IMEI carrier; optional, can be inlined)
internal/cache/*                     (minus redis_list.go command-queue usage)
internal/db/db.go
internal/logger/logger.go
internal/models/*
internal/rabbitmq/*
internal/services/app_service.go
internal/services/telemetry_service.go
internal/services/device_service.go
internal/services/organisation_service.go
internal/teltonika/parse_codec_8.go
internal/teltonika/imei_parser.go    (kept only if any util references it; handshake path removed)
internal/teltonika/helper_func.go
internal/teltonika/IoElementsMap.go
internal/util/*
```

Removed:

```
internal/tcp/                        (entire package — server.go, handler.go)
internal/teltonika/parse_codec_8_extended.go
internal/teltonika/parse_codec_12.go
internal/apptypes/codec_12_command.go
internal/apptypes/codec_12_message.go
internal/apptypes/teltonika_packet.go  (TeltonikaPacket interface — only the removed
                                        Codec 8E/12 dispatch in tcp/handler.go used it)
internal/cache/redis_list.go         (Codec 12 pending-command LPop) — drop if unused
```

New:

```
cmd/replay/
├── main.go                          # Entry point: bootstrap + replay loop
├── settings.go                      # Env loading, Redis/DB init, device/org sync
└── cron_jobs.go                     # Latest-telemetry flush cron (reused)
internal/replay/
├── loader.go                        # gzip + CSV streaming, row → ReplayPacket
├── grouper.go                       # group rows by IMEI, sort by happened_at
├── scheduler.go                     # per-device goroutine, wall-clock pacing
├── offset.go                        # per-day offset computation + apply
├── rotation.go                      # day rotation + REPLAY_DAYS looping
└── replay_test.go
```

---

## 14. Core Types (new)

```go
// One decoded CSV row, before parsing.
type ReplayPacket struct {
    IMEI       string
    HappenedAt time.Time   // original UTC from column 1
    Raw        []byte      // hex-decoded column 3 (full Codec 8 packet)
}

// Per-day plan, grouped and sorted.
type ReplayDay struct {
    FileDate time.Time                  // midnight UTC of the file's date
    Offset   time.Duration              // today_midnight - FileDate
    ByDevice map[string][]ReplayPacket  // IMEI -> sorted packets
}
```

`appcore.App` is reused as-is. Codec 12 fields, if any, go unused and may be
removed for cleanliness. No new locks are required beyond those already present;
per-device goroutines write `LastTelemetryMap`/`UpdatedDevices` under the
existing `LatestTelemetryLock`, and `LastTsMap` under `LastTsLock`, exactly as
the TCP handler goroutines did.

---

## 15. Concurrency Model

| Resource | Protection | Writers |
|----------|-----------|---------|
| `LastTelemetryMap` + `UpdatedDevices` | `LatestTelemetryLock` (Mutex) | per-device replay goroutines; cron reads+clears |
| `LastTsMap` | `LastTsLock` (RWMutex) | per-device replay goroutines (dedup) |
| `Devices` map | `DevicesLock` (RWMutex) | sync goroutine / device creation; replay reads |
| `Organisations` map | `OrganisationsLock` (RWMutex) | sync goroutine writes; replay reads |
| Redis hash replace | Lua (atomic) | device/org sync |
| Redis pub/sub | dedicated goroutine + channel (`PubCh`) | replay goroutines send |
| Day goroutines | `errgroup` + context; optional semaphore | replay loop |

The model is a direct analogue of the parser's goroutine-per-connection design,
with goroutine-per-device replacing goroutine-per-connection.

---

## 16. Contract Safety Principles

1. **Never break the RabbitMQ contract** — `FlatAvlRecord` JSON must match the
   live parser so `telemetry.db.writer.node.ts` is untouched.
2. **Never break the Redis key schema / live channel** — keys and
   `teltonika:live` payload must match so `socketio.gateway.node.ts` is
   untouched.
3. **CRC validation always runs** — computed against the original unmodified
   bytes at fire time; the *enforcement* action is configurable via
   `REPLAY_CRC_MODE` (`reject` drops, `warn` keeps), and every failure is logged
   with IMEI + raw packet. Validation itself is never skipped.
4. **Timestamp dedup is preserved** — `LastTsMap` still guards against duplicate
   records, now keyed on adjusted timestamps.
5. **Offset is uniform per day** — one whole-day, midnight-anchored offset
   applied to both scheduling and payload, so data stays coherent.
6. **Never replay a packet before its scheduled time, and skip past-due
   packets** — on a mid-day startup, packets whose scheduled time has already
   passed are dropped, not back-filled. The next day's file replays in full
   from midnight.
7. **Shared infra is safe only for retired devices** — the service shares all
   contracts with the live parser on the same infrastructure (§9.1). This is
   correct **only** while replayed IMEIs are offline/retired and not
   transmitting live. Never replay an IMEI that is currently live.

---

## 17. Verification

```bash
go test ./...
go build -o teltonika-replay ./cmd/replay
```

Focused tests to add:

- `internal/replay/loader_test.go` — gzip + CSV parsing, malformed-row skipping,
  hex decode, IMEI whitelist filtering (non-whitelisted rows dropped before
  decode; empty-whitelist required/optional behavior; goroutine count equals
  whitelist size present in file).
- `internal/replay/offset_test.go` — whole-day offset math across month/year
  boundaries and DST-irrelevant UTC; e.g. `2025-08-15` -> `2026-07-27` yields
  `29,894,400s` (346 days).
- `internal/replay/scheduler_test.go` — per-device ordering, mid-day startup
  (packets scheduled before `now` are skipped, sending begins at the first
  still-future packet), context cancellation stops goroutines.
- `internal/replay/rotation_test.go` — start file resolution, day increment,
  wrap-back after `REPLAY_DAYS`, missing-file skip/halt, preload fires
  `REPLAY_PRELOAD_LEAD` before midnight, and the active-day switch happens at
  the UTC midnight tick.
- Codec 8 parse test reusing official Teltonika hex vectors and a sample row
  from a real `raw_packets_*.csv`.
- CRC-16/IBM validation test: a known-good vector passes; a corrupted vector
  fails; `REPLAY_CRC_MODE=reject` drops the packet while `warn` keeps it, and
  both log the IMEI + raw packet.
- Contract tests asserting RabbitMQ body and `teltonika:live` payload field
  names match the live parser's `FlatAvlRecord`.

When changing cross-service contracts, inspect or test the dependent service
(`telemetry.db.writer.node.ts`, `socketio.gateway.node.ts`) before treating a
change as complete.

---

## 18. Removed From The Parser (explicit)

| Removed | Reason |
|---------|--------|
| `internal/tcp/server.go`, `handler.go` | No TCP; input is CSV |
| IMEI handshake (`imei_parser.go` handshake path) | IMEI comes from CSV column 2 |
| ACK / NACK (`0x01` / `0x00` / 4-byte record-count) | No socket to reply to |
| Codec 8 Extended (`0x8E`) parser | CSV data is Codec 8 only |
| Codec 12 (`0x0C`) parser, command lifecycle, retries | Dummy service; no commands |
| `TeltonikaPacket` interface (`apptypes/teltonika_packet.go`) | Only abstracted the removed Codec 8/8E/12 dispatch; Codec 8 is the only path now |
| Redis Codec 12 keys (pending/inflight/sync) and `redis_list.go` LPop | No commands |
| `TCP_PORT`, `TCP_TIMEOUT` env vars | No TCP |

---

## 19. Resolved Decisions

1. **Day advance trigger:** *resolved* — the active day switches at the **UTC
   midnight tick (00:00:00)**. The next file is background-loaded
   `REPLAY_PRELOAD_LEAD` (default 1h) before midnight and activated at the tick.
2. **No speed multiplier:** *resolved* — replay runs at real time; the
   midnight-anchored model relies on this.
3. **Startup mid-day behavior:** *resolved* — **skip** packets whose scheduled
   time has already passed; begin sending from the first still-future packet.
   Every subsequent day replays in full from midnight. No back-filling.
4. **All UTC:** *resolved* — every timestamp/comparison is UTC; local timezone
   handling lives in downstream services.
5. **Deployment = shared infra, no namespacing:** *resolved* — runs on the same
   Redis/RabbitMQ/PostgreSQL as the live parser, replays the same real IMEIs,
   and reuses the real DB writer and Socket.IO gateway unchanged. Identical
   contracts; no `MICROSERVICE_NAME` override. Safe **only** under the §9.1
   precondition that replayed devices are retired/offline. If that ever ceases
   to hold, switch to the namespaced coexistence model described in §9.1
   (out of scope here).
6. **IMEI whitelist from `.env`, fixed until restart:** *resolved* —
   `REPLAY_IMEI_WHITELIST` (comma-separated) is read once at startup, applied on
   every file load, and filters rows before hex-decode. Only whitelisted IMEIs
   are held in memory and given a goroutine. Changing the list requires a
   restart. Empty whitelist replays nothing by default
   (`REPLAY_WHITELIST_REQUIRED=true`).

---

*Derived from the `teltonika.parser.go` SPEC and context; TCP, Codec 8E, and
Codec 12 removed; CSV replay with whole-day time-shift added.*
