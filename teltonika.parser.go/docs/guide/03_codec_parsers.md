# Codec Parser Notes

> Part of the guide. Start at **[01_service_walkthrough.md](01_service_walkthrough.md)**
> for the whole-service picture; the TCP flow that calls these parsers is in
> **[02_tcp_parser_flow.md](02_tcp_parser_flow.md)**; background branches are in
> **[04_infra_branches.md](04_infra_branches.md)**. For the full byte specs, load
> the `teltonika-codec` skill.

These are the parsers in `internal/teltonika` that `handleTcpData` dispatches to
(see `02_tcp_parser_flow.md`, `handler.go ref:031`). They turn raw device bytes into
Go structs. All multi-byte fields are **big-endian**.

Dispatch by codec ID (byte 8):

- `8`   → `ParseCodec8`
- `142` (0x8E) → `ParseCodec8Extended`
- `12`  (0x0C) → `ParseCodec12`

---

## Shared building blocks

### `assertCanRead()` — the bounds guard
(`helper_func.go ref:032`)

Every read is preceded by `assertCanRead(data, offset, need, context)`. It
fails if there are fewer than `need` bytes left from `offset`. This is what
keeps a malformed / truncated packet from panicking on an out-of-range slice —
instead it returns a clear "buffer too short for X" error.

The parsers walk the buffer with a single `offset` cursor that only moves
forward, and every parser ends with a **full-consume check**
(`offset != len(data)` → error), so leftover or missing bytes are caught.

### `ImeiParser()` — length-prefixed IMEI
(`imei_parser.go ref:033`)

Used only for the 17-byte handshake. Layout: `byte[0..1]` is the length, then
that many ASCII digits. It reads the length, checks the buffer holds it, then
slices the IMEI string out. No hex decoding — the IMEI bytes are already ASCII.

---

## `ParseCodec8` (0x08) — AVL telemetry

### Header
(`parse_codec_8.go ref:034`)

Fixed layout, then `Quantity1` records follow:

| field       | size | notes                                  |
|-------------|------|----------------------------------------|
| Preamble    | 4    | always `0x00000000`                    |
| DataLength  | 4    | length of everything after this field  |
| CodecID     | 1    | `0x08`                                  |
| Quantity1   | 1    | number of AVL records in this packet   |

The whole packet is also stored as a hex string (`packet.Packet`) for logging /
replay. `CodecType` is set to `"AVL_Data"`.

### One AVL record
(`parse_codec_8.go ref:035`)

Each record is: timestamp → priority → GPS → IO.

- **Timestamp** (8 bytes, ms since epoch). Stored two ways: `Timestamp` as unix
  seconds string, `HappenedAt` as RFC3339Nano UTC.
- **Priority** (1 byte).
- **GPS element** (15 bytes fixed): Longitude (4) + Latitude (4) + Altitude (2)
  + Angle (2) + Satellites (1) + Speed (2). Longitude/Latitude are signed ints
  divided by `10_000_000` to get degrees.

### IO elements
(`parse_codec_8.go ref:036`)

IO starts with `EventID` (1 byte) and `ElementCount` (1 byte, total count),
then four buckets grouped by value width. Each bucket starts with a 1-byte
count `Nk`, followed by that many `(id, value)` pairs:

| bucket | id size | value size | pair size |
|--------|---------|------------|-----------|
| N1     | 1       | 1          | 2         |
| N2     | 1       | 2          | 3         |
| N4     | 1       | 4          | 5         |
| N8     | 1       | 8          | 9         |

All values land in a single `Elements` map keyed by the id as a string. N8
values that overflow a uint32 are stored as a **string** (JS-safe number
compatibility); smaller ones stay numeric.

### Trailer
(`parse_codec_8.go ref:037`)

After the records: `Quantity2` (1 byte) must equal `Quantity1`, then `CRC`
(4 bytes). Finally the full-consume check runs.

---

## `ParseCodec8Extended` (0x8E / 142) — wider IO + NX
(`parse_codec_8_extended.go ref:038`)

Same overall shape as Codec 8, with these differences:

- `EventID` and `ElementCount` are **2 bytes** each (not 1).
- Every IO **id** is **2 bytes**, and each bucket **count `Nk`** is **2 bytes**
  (so pair sizes grow by the extra id byte: N1=3, N2=4, N4=6, N8=10).
- Adds an extra **NX bucket** for variable-length values: each entry is
  `id` (2) + `length` (2) + `length` raw bytes, stored as a **hex string** in
  `Elements`.

Everything else (header, GPS, timestamp handling, trailer, full-consume check)
is identical to Codec 8.

---

## `ParseCodec12` (0x0C) — GPRS command response
(`parse_codec_12.go ref:039`)

This parser only handles the **response** direction. Outgoing commands are built
separately in `Codec12Command.ToPacket` (`codec_12_command.go ref:040`); the
send/retry lifecycle around them is in `02_tcp_parser_flow.md`.

Layout: Preamble (4) + DataLength (4) + CodecID (1) + Quantity1 (1) + **Type**
(1) + ResponseSize (4) + Response (`ResponseSize` bytes) + Quantity2 (1) +
CRC (4).

- **Type must be `0x06`** (response). If it is `0x05` (command) or anything
  else, the parser rejects it — the parser never expects to *receive* a command.
- The response bytes are decoded as ASCII when printable; otherwise they fall
  back to a `"New value <hex>"` string.
- `CodecType` is set to `"GPRS_Messages"`, which is exactly the type string the
  inflight-command logic in `handleTcpData` branches on to mark a command
  completed (see `02_tcp_parser_flow.md`, `handler.go ref:027`).
