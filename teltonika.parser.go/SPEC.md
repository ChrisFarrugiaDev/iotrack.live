# Teltonika Parser Service Spec

`teltonika.parser.go` receives raw Teltonika TCP traffic, turns it into platform
telemetry and command state, and forwards that state to the rest of
`iotrack.live`.

## Service Role

This service is responsible for:

- Accepting Teltonika device TCP connections.
- Handling the IMEI handshake.
- Looking up known devices from in-memory state backed by Redis/PostgreSQL.
- Creating unknown devices with vendor `teltonika` and status `new`.
- Parsing Codec 8, Codec 8 Extended, and Codec 12 packets.
- Sending Teltonika ACKs or Codec 12 command packets back to devices.
- Publishing telemetry to RabbitMQ for durable storage.
- Publishing latest telemetry to Redis for live Socket.IO forwarding.
- Managing Codec 12 command lifecycle through Redis.

## Startup Flow

Entrypoint: `cmd/parser/main.go`

1. Initialize `appcore.App` state, locks, UUID generator, cron, and maps.
2. Load environment variables unless running with `DOCKERIZED=true`.
3. Initialize logger.
4. Connect to Redis and create parser cache prefix `teltonika.parser.go:`.
5. Load `rabbitmq_config.json` and start the RabbitMQ producer.
6. Connect to PostgreSQL and initialize models.
7. Start the async Redis publisher.
8. Sync devices and organisations from PostgreSQL to Redis.
9. Load devices and organisations from Redis into local in-memory maps.
10. Build `LastTsMap` from device last telemetry timestamps.
11. Register cron jobs.
12. Start the TCP server.

## TCP Packet Flow

Core files:

- `internal/tcp/server.go`
- `internal/tcp/handler.go`

Connection handling:

- TCP server listens on `TCP_PORT`, default `5027`.
- Every accepted connection runs in its own goroutine.
- Each connection keeps a local `apptypes.Meta` with the active IMEI.
- Reads use a 4096-byte buffer and reset the deadline after every packet.
- Timeout defaults to `30` seconds.

Packet handling:

- A 17-byte packet is treated as the IMEI handshake.
- Other packets are treated as data packets and require a successful handshake.
- Codec ID is read from byte index `8`.
- Supported codecs:
  - `8`: Codec 8 telemetry
  - `142`: Codec 8 Extended telemetry
  - `12`: Codec 12 GPRS command response

ACK behavior:

- Successful IMEI handshake returns one byte: `0x01`.
- Failed IMEI handshake returns one byte: `0x00`.
- Telemetry packets return a 4-byte big-endian ACK containing record count.
- If a command is ready to send, the parser writes the Codec 12 command packet
  instead of the telemetry ACK.

## Device Metadata Flow

Known devices are loaded into `app.Devices`, keyed by IMEI/external ID.

Startup sync:

- PostgreSQL devices -> Redis hash `iotrack.live:devices`
- Redis hash `iotrack.live:devices` -> `app.Devices`

On unknown IMEI handshake:

- Create a new device in PostgreSQL.
- Use:
  - `external_id`: IMEI
  - `external_id_type`: `imei`
  - `vendor`: `teltonika`
  - `protocol`: `4G`
  - `status`: `new`
- Cache it in Redis hash `iotrack.live:devices`.
- Add it to `app.Devices`.

Organisations follow the same startup pattern:

- PostgreSQL organisations -> Redis hash `iotrack.live:organisations`
- Redis hash `iotrack.live:organisations` -> `app.Organisations`

## Telemetry Flow

Parser package:

- `internal/teltonika/parse_codec_8.go`
- `internal/teltonika/parse_codec_8_extended.go`
- `internal/apptypes/codec_8_avl_record.go`
- `internal/apptypes/flat_avl_record.go`

For each AVL telemetry record, the parser builds a RabbitMQ JSON payload with:

- `device_id`
- `asset_id`
- `organisation_id`
- `happened_at`
- `protocol`
- `vendor`
- `telemetry`

The nested `telemetry` object includes:

- `timestamp`
- `priority`
- `longitude`
- `latitude`
- `altitude`
- `angle`
- `satellites`
- `speed`
- `elements`

RabbitMQ contract:

- Exchange: `teltonika`
- Routing key: `teltonika_telemetry`
- Queue: `telemetry`
- Content type: `application/json`
- Consumer: `../telemetry.db.writer.node.ts`
- Consumer insert target: PostgreSQL `app.telemetry`
- Delivery role: durable telemetry history. The writer consumes the JSON body
  and bulk inserts the records into PostgreSQL.

The RabbitMQ body is the history contract. Keep the existing JSON field names
stable unless the parser and writer are changed together.

## Latest Telemetry And Live Updates

Latest telemetry is kept in local memory and flushed to Redis.

In-memory state:

- `app.LastTelemetryMap`
- `app.LastTsMap`
- `app.UpdatedDevicesSetA`
- `app.UpdatedDevicesSetB`
- `app.ActiveList`

Redis keys:

- `teltonika.parser.go:device-latest-telemetry:<device_id>`
- `teltonika.parser.go:device-latest-telemetry:id`

Redis latest telemetry is the current-state recovery path. It is updated from
the newest telemetry record seen for each device and can be used by downstream
services to rebuild current device state.

The parser publishes live updates to Redis channel `teltonika:live`.

Redis pub/sub is the live UI path. It is best-effort: subscribers can miss a
message, then recover the latest device state from Redis.

Consumer:

- `../socketio.gateway.node.ts/src/App.ts`

Gateway behavior:

- Subscribes to `teltonika:live`.
- Parses the parser's plain JSON message.
- Emits `live-update` to Socket.IO room `device:<device_id>`.

## Codec 12 Command Flow

Command creation starts outside the parser.

Producer:

- `../web.backend.node.ts/src/api/controllers/teltonika.controller.ts`
- Route: `POST /api/teltonika/codec12/commands/:imei`

Backend API behavior:

- Inserts command rows into PostgreSQL table `teltonika.codec12_commands`.
- Pushes command records into Redis list:
  `teltonika.parser.go:codec12:pending-commands:<imei>`.

Parser Redis keys:

- Pending list: `teltonika.parser.go:codec12:pending-commands:<imei>`
- Inflight command: `teltonika.parser.go:codec12:inflight-commands:<imei>`
- Sync hash: `teltonika.parser.go:codec12:sync-commands`

Parser command lifecycle:

1. If an inflight command exists and the device sends a Codec 12 response, mark
   the command `completed`, store the response, delete inflight state, and write
   it to the sync hash.
2. If an inflight command exists and the device sends telemetry instead of a
   response, resend the command while `Retries < 10`.
3. If retry limit is reached, mark the command `failed` with response
   `no_response`, delete inflight state, and write it to the sync hash.
4. If no inflight command exists, pop one pending command from the Redis list,
   mark it `sent`, store it as inflight, and send the Codec 12 packet to the
   device.

Command sync consumer:

- `../telemetry.db.writer.node.ts/src/services/update-teltonika-codec12-commands-from-redis.service.ts`
- Reads and deletes `teltonika.parser.go:codec12:sync-commands`.
- Bulk updates PostgreSQL table `teltonika.codec12_commands`.

## Cron Jobs

Parser cron:

- File: `cmd/parser/cron_jobs.go`
- `LATEST_TELEMETRY_FLUSH_CRON` controls how often
  `FlushLastTelemetryJob` writes updated latest telemetry to Redis.
- Default schedule is `0,20,40 * * * * *`, which runs every 20 seconds.

Background sync goroutine:

- File: `cmd/parser/main.go`
- Periodically syncs devices from PostgreSQL to Redis and from Redis to memory.

Writer service cron jobs:

- Codec 12 command sync runs in `../telemetry.db.writer.node.ts/src/App.ts`.
- Latest device telemetry DB sync runs in the same writer service.

## Environment

Important environment variables:

- `DOCKERIZED`
- `GO_ENV`
- `LOG_MODE`
- `LOG_FILE_PATH`
- `DEBUG`
- `TCP_PORT`
- `TCP_TIMEOUT`
- `LATEST_TELEMETRY_FLUSH_CRON`
- `MICROSERVICE_NAME`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB`
- `REDIS_CACHE_EXPIRE`
- `RABBITMQ_HOST`
- `RABBITMQ_PORT`
- `RABBITMQ_USER`
- `RABBITMQ_PASSWORD`
- `DB_URL`
- `DB_MAX_CONNS`
- `DB_MIN_CONNS`
- `DB_MAX_CONN_LIFETIME`
- `DB_MAX_CONN_IDLE_TIME`

Docker Compose service:

- `teltonika-parser-go`

## Verification

Run from this directory:

```bash
go test ./...
go build -o teltonika-parser ./cmd/parser
```

When changing cross-service contracts, also inspect or test the dependent
service before treating the parser change as complete.

## Current Improvement Targets

- Add focused tests for Codec 8, Codec 8 Extended, Codec 12, and IMEI parsing.
- Document representative packet examples.
- Add tests around Codec 12 pending, inflight, retry, completed, and failed
  command transitions.
- Make RabbitMQ telemetry payload and Redis live payload contracts explicit in
  tests.
- Review TCP read framing assumptions if devices can send split or combined
  packets over one connection.
- Review graceful shutdown behavior for active TCP connection goroutines.
