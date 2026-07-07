# TCP Parser Flow Notes

> Part of the guide. Start at **[01_service_walkthrough.md](01_service_walkthrough.md)**
> for the whole-service picture; this file is the TCP hot-path deep dive. Byte-level
> parsing is in **[03_codec_parsers.md](03_codec_parsers.md)**; the background
> branches are in **[04_infra_branches.md](04_infra_branches.md)**.

## `server.go`

### `Start()`

The TCP server starts listening for incoming device connections on the port
from the `TCP_PORT` environment variable, defaulting to **5027** if it is unset
or invalid.
(`server.go ref:021`)

A background goroutine watches the context. When the app is shutting down and
`ctx.Done()` fires, it closes the listener. Closing the listener unblocks the
`Accept()` call below so the accept loop can exit cleanly instead of leaking.

The server then loops, accepting incoming connections. If `Accept()` returns an
error, it checks whether we are shutting down (`ctx.Done()`): if so it stops; if
not, it logs the error and keeps accepting.

Each accepted connection is handled in its own **goroutine**, so multiple
devices can be served concurrently.
(`server.go ref:022`)

---

### `handleConnection()`

A `deviceMeta` (`apptypes.Meta`) is created once per connection. Today it only
carries the **IMEI** — the other fields (DeviceID, AssetID, OrganisationID) are
present in the struct but commented out. It stays alive for the whole
connection and is passed by pointer into the data handler.

Two `defer`s are registered: one closes the connection, one logs the close for
debugging.

A read timeout comes from `TCP_TIMEOUT` (default **30s**). It is set as a
deadline on the connection.
(`server.go ref:023`)

If the device stops sending without properly closing, the read will hit the
deadline and the connection is closed.

A **4096-byte buffer** is allocated once for this connection.

Because a TCP connection can stay open and send multiple packets, the
connection is read inside a loop until it ends.
(`server.go ref:024`)

Each `Read()` reuses the same buffer, writing new incoming data from the start
of the slice. The returned `n` tells us how many bytes arrived, so `buf[:n]`
gives us only the valid data from that read.

Read errors are classified:

- **timeout** → `handleTcpTimeout`, then return
- **EOF** (client closed) → `handleTcpEnd`, then return
- anything else → `handleTcpError`, then return

After every successful read, the deadline is reset to keep the session alive,
and the received bytes (`buf[:n]`) are passed to the packet handler.
(`server.go ref:014`)

---

## `handler.go`

### `handleTcpData()`

Two locals are set up first:

- `cmd` — a Codec 12 command to send back to the device, if there is one
- `ack` — a 4-byte Teltonika acknowledgment (holds the record count)

There is also a small `fail` helper that logs an error and writes the current
`ack` back to the device.

The parser then branches on the packet length.
(`handler.go ref:015`)

- If the packet is **17 bytes**, it is the **IMEI handshake**
- Otherwise, it is a **data packet**

A data packet can carry:

- **Codec 8 / Codec 8 Extended** telemetry data
- **Codec 12** command/response data

---

### IMEI handshake flow

The handshake is `000F` + 15 ASCII IMEI bytes. The parser calls `ImeiParser`.
If that fails, it replies with a **negative 1-byte ACK (`0x00`)** and returns.

On success it looks the IMEI up in the in-memory `app.Devices` map (under a read
lock).

If the device is **not** found, it is treated as a **new device**:

- build a `models.Device` (external id = IMEI, type `imei`, vendor
  `teltonika`, fresh UUID, status `new`, protocol `4G`)
- persist it to the DB (`Device.Create`)
- write it to the shared cache (`HSet "devices"` under the `iotrack.live:`
  prefix)
- add it to the in-memory `app.Devices` map (under a write lock)
    (`handler.go ref:025`)

Any failure along the way replies `0x00` and returns.

Finally it records the IMEI on `deviceMeta` and replies with a **positive
1-byte ACK (`0x01`)**.
(`handler.go ref:026`)

> Note: the `0x01`/`0x00` single-byte ACK is **handshake only**. Data packets
> are acknowledged with a 4-byte record count (see below).

---

### Data packet flow

The parser retrieves the current device from `app.Devices` using the IMEI on
`deviceMeta` (under a read lock).
(`handler.go ref:016`)

If no device is found (handshake was likely skipped), it logs, replies `0x00`,
and returns.

It then reads the **codec ID** at byte 8 (guarding against a too-short packet)
and dispatches:

- `8`   → `ParseCodec8`
- `142` → `ParseCodec8Extended`  (0x8E, Codec 8 Extended)
- `12`  → `ParseCodec12`
- anything else → unsupported-codec error

A parse error replies `0x00` and returns.

---

### Codec 12 inflight command check

After parsing, the parser checks Redis for an **inflight** Codec 12 command for
this device: key `codec12:inflight-commands:<imei>`.
(`handler.go ref:017`)

An inflight command means the server already sent a Codec 12 command and is
still waiting for the device's response.

If one exists, it is loaded and unmarshalled, then the parser branches on the
parsed packet type:

#### If the packet type is `GPRS_Messages`

The device has replied to the Codec 12 command.

The inflight entry is deleted from Redis and the command is marked **completed**
via `SetToSync("completed", <response>)`.
(`handler.go ref:027`)

`SetToSync` stamps `RespondedAt`/status/response and writes the command into the
Redis hash `codec12:sync-commands` (keyed by UUID). The
`telemetry.db.writer.node.ts` service later reads that hash, UPSERTs the status
into PostgreSQL (pending → inflight → complete/failed), and removes it from the
hash. Redis is the transient state store; PostgreSQL is the durable truth.

#### If the packet type is `AVL_Data`

The device sent telemetry but has **not** answered the command yet.

- If retries are `< 10`: call `SetToInflight` (re-stamps `SentAt`, sets status
  `sent`, and **increments the retry count** since `SentAt` was already set),
  rebuild the command bytes with `ToPacket`, and stage them in `cmd` to resend.
- Otherwise: delete the inflight entry and mark the command **failed** via
  `SetToSync("failed", "no_response")`.
    (`handler.go ref:028`)

---

### Pending command flow

If there is **no** inflight command, the parser checks a per-device queue of
**pending** commands: key `codec12:pending-commands:<imei>`.

If a pending command exists, it is `LPop`ped off the list, promoted to inflight
via `SetToInflight`, serialized with `ToPacket`, and staged in `cmd` to be sent.
(`handler.go ref:029`)

This is how a freshly created command (queued by the backend) first reaches the
device: pending → inflight → (on device reply) completed.

---

### Sending the reply

The 4-byte `ack` is filled with the record count
(`binary.BigEndian.PutUint32(ack, quantity1)`).

- If `cmd` has bytes (a Codec 12 command is staged), the command packet is
  written to the device.
- Otherwise the 4-byte telemetry `ack` is written.

So on any given data packet the device gets **either** a staged Codec 12
command **or** the record-count ACK — not both.
(`handler.go ref:018`)

---

### Data forwarding (telemetry only)

If the parsed packet is `AVL_Data`, each AVL record is flattened into a
`FlatAvlRecord` (timestamp, priority, GPS fields, IO elements) and wrapped with
device context (`device_id`, `asset_id`, `organisation_id`, `happened_at`,
`protocol`, `vendor`).

Each record is JSON-marshalled and published to RabbitMQ via
`SendDirectMessage("teltonika_telemetry", "teltonika", msg)`. The
`telemetry.db.writer.node.ts` service consumes this for durable inserts.
(`handler.go ref:019`)

For the **first** record in the packet (`i == 0`, the most recent one) the
parser also updates live state, but only if it is genuinely newer:
(`handler.go ref:030`)

- Parse `happened_at` (RFC3339). On failure, skip the comparison.
- Under `LastTsLock`, read the last-seen timestamp for this device from
  `LastTsMap`, decide `shouldUpdate` (first-seen or strictly newer), and if so
  write the new timestamp back — the read-check-write is kept atomic because
  multiple handler goroutines can reach here at once.
- If `shouldUpdate`: merge into the latest-telemetry snapshot
  (`Service.UpdateLastTelemetry`) and push the message onto `PubCh` for the
  `teltonika:live` Redis channel (consumed by the Socket.IO gateway for the
  browser).

This last-timestamp guard prevents out-of-order / older buffered records from
overwriting newer live state.

---

### Connection lifecycle helpers

`handleTcpTimeout`, `handleTcpClose`, `handleTcpEnd`, and `handleTcpError` are
thin logging helpers. Each logs with the IMEI when known, otherwise a bare
message — useful for tracing why a connection ended.

---

### Known rough edges (from the code)

- `inflightExist` is re-queried from Redis right after a delete (marked `456A`
  in the code) instead of just being set to `false` — a small redundant round
  trip.
