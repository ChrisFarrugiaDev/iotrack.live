# Teltonika Codec 8 Extended Protocol Reference

**Codec ID:** `0x8E` (decimal 142)
**Used for:** AVL telemetry data — same purpose as Codec 8 but supports more IO elements (wider IDs, variable-length NX elements).

> Read `references/codec8.md` first. This document only covers differences from Codec 8.

---

## Key Differences from Codec 8

| Field                 | Codec 8         | Codec 8 Extended     |
|-----------------------|-----------------|----------------------|
| Codec ID              | `0x08`          | `0x8E` (142 decimal) |
| Event IO ID width     | 1 byte          | **2 bytes** (uint16) |
| N of Total IO width   | 1 byte          | **2 bytes** (uint16) |
| N1/N2/N4/N8 count width | 1 byte each  | **2 bytes each** (uint16) |
| IO ID width           | 1 byte per element | **2 bytes per element** (uint16) |
| NX (variable) elements | not present   | **added** (see below) |

IO ID range expands from 0–255 (1 byte) to 0–65535 (2 bytes), enabling many more sensor/parameter types.

---

## Packet Structure (byte-level)

Outer wrapper is identical to Codec 8:

```
[ Preamble        ] 4 bytes  — always 0x00000000
[ Data Field Len  ] 4 bytes  — uint32 big-endian
[ Codec ID        ] 1 byte   — 0x8E
[ Quantity1       ] 1 byte   — number of AVL records
[ AVL Data × N   ]           — repeated Quantity1 times
[ Quantity2       ] 1 byte   — must equal Quantity1
[ CRC-16          ] 4 bytes  — uint32 big-endian; CRC-16/IBM of [CodecID … Quantity2]
```

---

## AVL Data Record (Extended IO Element)

Timestamp (8 bytes), Priority (1 byte), and GPS Element (15 bytes) are **identical** to Codec 8.

### IO Element (Codec 8 Extended)

```
[ Event IO ID    ] 2 bytes — uint16 big-endian; 0 if not IO-triggered
[ N of Total IO  ] 2 bytes — uint16 big-endian; total IO element count

[ N1 count       ] 2 bytes — uint16; number of 1-byte IO values
  [ IO ID        ] 2 bytes   ─┐ repeated N1 times
  [ Value        ] 1 byte    ─┘

[ N2 count       ] 2 bytes — uint16; number of 2-byte IO values
  [ IO ID        ] 2 bytes   ─┐ repeated N2 times
  [ Value        ] 2 bytes   ─┘ uint16 big-endian

[ N4 count       ] 2 bytes — uint16; number of 4-byte IO values
  [ IO ID        ] 2 bytes   ─┐ repeated N4 times
  [ Value        ] 4 bytes   ─┘ int32 big-endian (signed)

[ N8 count       ] 2 bytes — uint16; number of 8-byte IO values
  [ IO ID        ] 2 bytes   ─┐ repeated N8 times
  [ Value        ] 8 bytes   ─┘ uint64 big-endian

[ NX count       ] 2 bytes — uint16; number of variable-length IO values
  [ IO ID        ] 2 bytes   ─┐
  [ Length       ] 2 bytes   ─┤ repeated NX times
  [ Value        ] Length bytes ─┘ raw bytes (stored as hex string in this project)
```

**NX elements** carry arbitrary binary payloads (e.g. beacon data, large sensor readings). Length is the byte count of Value. Stored in `IOelement.Elements` as lowercase hex string (e.g. `"0a1b2c"`).

---

## CRC

Same algorithm as Codec 8 — CRC-16/IBM (`util.Crc16IBM()`), stored as 4-byte uint32 big-endian.

---

## Go Struct Mapping

Uses the same `Codec8AvlRecord` / `AvlData` / `GPSelement` / `IOelement` structs as Codec 8.

| Wire field        | Go struct field                    | Notes                              |
|-------------------|------------------------------------|------------------------------------|
| Event IO ID       | `IOelement.EventID`                | Read as uint16, stored as `int`    |
| N Total IO        | `IOelement.ElementCount`           | Read as uint16, stored as `int`    |
| N1/N2/N4/N8 IDs  | `IOelement.Elements` keys          | Read as uint16, key = decimal str  |
| NX value          | `IOelement.Elements[id]`           | `string` (lowercase hex)           |

**`CodecType`** is still `"AVL_Data"` (same as Codec 8) — the handler dispatches by numeric Codec ID (`142`), not by CodecType.

---

## Detection in Handler

```go
case 142:
    dataPacket, err = teltonika.ParseCodec8Extended(packet)
```

The first byte of IO offset differs from Codec 8 immediately at the Event IO ID field — 2 bytes instead of 1. Any mis-dispatch between 8 and 8E will cause a parse error at that point.
