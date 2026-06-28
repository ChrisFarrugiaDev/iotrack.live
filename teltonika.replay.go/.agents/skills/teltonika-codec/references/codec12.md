# Teltonika Codec 12 Protocol Reference

**Codec ID:** `0x0C` (decimal 12)
**Used for:** GPRS command/response messages — sending ASCII text commands to a device and receiving their text responses.

---

## Overview

Codec 12 is bi-directional:
- **Server → Device:** `type = 0x05` (command) — server sends a text command (e.g. `"getinfo"`)
- **Device → Server:** `type = 0x06` (response) — device replies with ASCII text (e.g. `"FW:03.27.14 ..."`).

This project only **parses responses** (`type = 0x06`). Commands are **built** via `Codec12Command.ToPacket()`.

---

## Packet Structure (byte-level)

```
[ Preamble        ] 4 bytes  — always 0x00000000
[ Data Field Len  ] 4 bytes  — uint32 big-endian; byte count from CodecID to Quantity2 (inclusive)
[ Codec ID        ] 1 byte   — 0x0C
[ Quantity1       ] 1 byte   — number of messages (always 1 in practice)
[ Type            ] 1 byte   — 0x05 = command, 0x06 = response
[ Size            ] 4 bytes  — uint32 big-endian; byte length of Content
[ Content         ] Size bytes — ASCII text (command string or response string)
[ Quantity2       ] 1 byte   — must equal Quantity1
[ CRC-16          ] 4 bytes  — uint32 big-endian; CRC-16/IBM of [CodecID … Quantity2]
```

---

## Command Packet (Server → Device)

Built by `Codec12Command.ToPacket()` in `internal/apptypes/codec_12_command.go`:

```go
preamble        = 0x00000000      // 4 bytes
codecId         = 0x0C            // 1 byte
commandQuantity1 = 0x01           // 1 byte
cmdType         = 0x05            // 1 byte: "command"
commandSize     = uint32(len(cmd)) // 4 bytes
commandBytes    = []byte(cmd)     // N bytes (ASCII)
commandQuantity2 = 0x01           // 1 byte
crc             = Crc16IBM(payload) // 4 bytes (as uint32)
```

CRC is computed over the **payload** = `[CodecID, Quantity1, Type, Size(4), Content, Quantity2]`.

---

## Response Packet (Device → Server)

Parsed by `ParseCodec12()` in `internal/teltonika/parse_codec_12.go`.

The parser:
1. Validates `type == 0x06` (rejects non-response packets with an error).
2. Reads `Size` bytes as `Content`.
3. If `Content` is printable ASCII → stores as plain string.
4. If not printable → stores as `"New value " + hex_pairs_string`.

Result is in `Codec12Message.Content.ResponseStr`.

---

## CRC

Same algorithm as Codec 8 — CRC-16/IBM (`util.Crc16IBM()`), stored as 4-byte uint32 big-endian. CRC covers `[CodecID … Quantity2]`.

---

## Command Lifecycle in This Project

```
pending  →  inflight (sent)  →  completed / failed
```

| Redis key                              | Purpose                                      |
|----------------------------------------|----------------------------------------------|
| `codec12:pending-commands:<IMEI>`      | List of queued commands (LPOP to dequeue)    |
| `codec12:inflight-commands:<IMEI>`     | Single in-flight command (TTL-less, deleted on response or after 10 retries) |
| `codec12:sync-commands` (hash)         | Completed/failed commands awaiting DB write  |

**Retry logic:** on every AVL packet from the device while an inflight command exists, the server resends the command (up to 10 retries). On the 11th miss, the command is marked `"failed"` with response `"no_response"`.

---

## Go Struct Mapping

| Wire field  | Go struct field                    | Type     |
|-------------|------------------------------------|----------|
| Preamble    | `Codec12Message.Preamble`          | `uint32` |
| Data Length | `Codec12Message.DataLength`        | `uint32` |
| Codec ID    | `Codec12Message.CodecID`           | `byte`   |
| Quantity1   | `Codec12Message.Quantity1`         | `byte`   |
| Type        | `GPRS.Type`                        | `byte`   |
| Content     | `GPRS.ResponseStr`                 | `string` |
| IsResponse  | `GPRS.IsResponse`                  | `bool`   |
| Quantity2   | `Codec12Message.Quantity2`         | `byte`   |
| CRC         | `Codec12Message.CRC`               | `uint32` |
| CodecType   | `Codec12Message.CodecType`         | `string` — always `"GPRS_Messages"` |

---

## Hex Example — Command Packet

Command: `"getinfo"` (7 bytes)

```
00 00 00 00       ← Preamble
00 00 00 0F       ← Data Field Length = 15
0C                ← Codec ID = 12
01                ← Quantity1 = 1
05                ← Type = command
00 00 00 07       ← Content Size = 7
67 65 74 69 6E 66 6F  ← "getinfo" (ASCII)
01                ← Quantity2 = 1
XX XX XX XX       ← CRC-16/IBM (4 bytes)
```

## Hex Example — Response Packet

Response: `"FW:03.27.14"` (11 bytes)

```
00 00 00 00       ← Preamble
00 00 00 13       ← Data Field Length = 19
0C                ← Codec ID = 12
01                ← Quantity1 = 1
06                ← Type = response
00 00 00 0B       ← Content Size = 11
46 57 3A 30 33 2E 32 37 2E 31 34  ← "FW:03.27.14"
01                ← Quantity2 = 1
XX XX XX XX       ← CRC-16/IBM (4 bytes)
```

---

## Detection in Handler

```go
case 12:
    dataPacket, err = teltonika.ParseCodec12(packet)
```

`CodecType == "GPRS_Messages"` distinguishes Codec 12 responses from AVL data in the TCP handler's dispatch logic.
