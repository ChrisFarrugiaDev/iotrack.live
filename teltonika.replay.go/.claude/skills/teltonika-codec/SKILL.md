---
name: teltonika-codec
description: >
  Teltonika GPS codec protocol reference for this Go parser project. Contains complete
  byte-level specs for Codec 8 (AVL telemetry, 0x08), Codec 8 Extended (AVL with wider
  IO IDs and NX elements, 0x8E / decimal 142), and Codec 12 (GPRS command/response, 0x0C).
  Use this skill whenever working on or asking about: parse_codec_8.go,
  parse_codec_8_extended.go, parse_codec_12.go, AVL data parsing, IO elements (N1/N2/N4/N8/NX),
  GPS element byte layout, CRC-16/IBM calculation, Teltonika packet structure, preamble,
  data field length, codec IDs, quantity fields, TCP ACK format, or Codec12 command/response
  lifecycle. Load it proactively when any of those files are open or mentioned — the specs
  are bundled offline so no network fetch is needed.
---

# Teltonika Codec Reference

This skill provides offline byte-level protocol specs for all codecs implemented in this project.
The Teltonika wiki (https://wiki.teltonika-gps.com/view/Codec) is the upstream source but is
blocked to automated fetches — specs here are derived from the source code and protocol knowledge.

## Codec overview

| Codec        | ID (hex) | ID (dec) | CodecType      | Direction          | Parser file                        |
|--------------|----------|----------|----------------|--------------------|------------------------------------|
| Codec 8      | `0x08`   | 8        | `AVL_Data`     | Device → Server    | `parse_codec_8.go`                 |
| Codec 8 Ext  | `0x8E`   | 142      | `AVL_Data`     | Device → Server    | `parse_codec_8_extended.go`        |
| Codec 12     | `0x0C`   | 12       | `GPRS_Messages`| Both directions    | `parse_codec_12.go` + `codec_12_command.go` |

## When to load each reference

Load only what you need for the task:

- Working on **Codec 8** parsing, IO elements (N1/N2/N4/N8), GPS struct, or CRC:
  → Read `references/codec8.md`

- Working on **Codec 8 Extended** (NX elements, wider IO IDs, 2-byte counts):
  → Read `references/codec8-extended.md` (also read codec8.md for shared fields)

- Working on **Codec 12** commands, responses, command lifecycle, or `Codec12Command.ToPacket()`:
  → Read `references/codec12.md`

## Common packet header (all codecs)

Every Teltonika packet starts with:
```
Bytes 0–3:   Preamble        — 0x00000000
Bytes 4–7:   Data Field Len  — uint32 big-endian; covers CodecID through Quantity2
Byte  8:     Codec ID        — identifies codec (8, 0x8E=142, or 12)
Byte  9:     Quantity1       — record/message count
```

The handler reads Codec ID at `packet[8]` to dispatch to the correct parser.

## CRC summary

All codecs use **CRC-16/IBM** (`util.Crc16IBM()` in `internal/util/hex_utils.go`):
- Computed over bytes from **Codec ID** through **Quantity2** (inclusive)
- Stored as a **4-byte uint32 big-endian** (upper 2 bytes are always 0x0000)
- Preamble and Data Field Length bytes are excluded from CRC

## TCP ACK

After any valid AVL data packet (Codec 8 or 8E), the server sends:
```
4-byte uint32 big-endian = Quantity1 (number of records received)
```
A value of `0x00000000` is a negative ACK (rejection / error).
Codec 12 command packets are sent instead of the ACK when a command is queued.
