# Teltonika Codec 8 Protocol Reference

**Codec ID:** `0x08` (decimal 8)
**Used for:** AVL telemetry data (GPS + IO elements) from Teltonika GPS devices.

---

## Packet Structure (byte-level)

```
[ Preamble        ] 4 bytes  — always 0x00000000
[ Data Field Len  ] 4 bytes  — uint32 big-endian; byte count from CodecID to Quantity2 (inclusive)
[ Codec ID        ] 1 byte   — 0x08
[ Quantity1       ] 1 byte   — number of AVL records in this packet
[ AVL Data × N   ]           — repeated Quantity1 times (see below)
[ Quantity2       ] 1 byte   — must equal Quantity1 (validation check)
[ CRC-16          ] 4 bytes  — uint32 big-endian; CRC-16/IBM of bytes [CodecID … Quantity2]
```

> **CRC coverage:** from Codec ID byte up to and including Quantity2 byte (i.e., everything inside Data Field Length). The preamble and Data Field Length bytes themselves are NOT included in CRC.

---

## AVL Data Record

Each record contains a timestamp, priority, GPS element, and IO element.

```
[ Timestamp       ] 8 bytes  — uint64 big-endian; milliseconds since Unix epoch (UTC)
[ Priority        ] 1 byte   — 0=Low, 1=High, 2=Panic
[ GPS Element     ] 15 bytes — see below
[ IO Element      ]          — variable length; see below
```

### GPS Element (15 bytes)

```
[ Longitude  ] 4 bytes — int32 big-endian; divide by 10,000,000 for decimal degrees
[ Latitude   ] 4 bytes — int32 big-endian; divide by 10,000,000 for decimal degrees
[ Altitude   ] 2 bytes — int16 big-endian; metres above sea level
[ Angle      ] 2 bytes — uint16 big-endian; heading 0–360 degrees
[ Satellites ] 1 byte  — number of visible satellites
[ Speed      ] 2 bytes — uint16 big-endian; km/h
```

**Sign handling:** Longitude and Latitude are signed int32. Negative = West/South. Example: `0x0212D88C` = 35,050,636 → 3.5050636°; `-0x2233` for a negative value.

### IO Element (variable length)

```
[ Event IO ID    ] 1 byte — ID of IO element that triggered this record; 0 if not IO-triggered
[ N of Total IO  ] 1 byte — total count of all IO elements in this record

[ N1 count       ] 1 byte — number of 1-byte IO values
  [ IO ID        ] 1 byte   ─┐ repeated N1 times
  [ Value        ] 1 byte   ─┘

[ N2 count       ] 1 byte — number of 2-byte IO values
  [ IO ID        ] 1 byte   ─┐ repeated N2 times
  [ Value        ] 2 bytes  ─┘ uint16 big-endian

[ N4 count       ] 1 byte — number of 4-byte IO values
  [ IO ID        ] 1 byte   ─┐ repeated N4 times
  [ Value        ] 4 bytes  ─┘ int32 big-endian (signed)

[ N8 count       ] 1 byte — number of 8-byte IO values
  [ IO ID        ] 1 byte   ─┐ repeated N8 times
  [ Value        ] 8 bytes  ─┘ uint64 big-endian
```

**IO ID range in Codec 8:** 1 byte → IDs 0–255.

**N of Total IO** = N1 + N2 + N4 + N8 (must equal the sum of all counts).

---

## CRC-16/IBM Algorithm

Teltonika uses CRC-16/IBM (also called CRC-16/ARC), initialised to `0x0000`, polynomial `0xA001` (reflected). The Go implementation in this project is `util.Crc16IBM()` in `internal/util/hex_utils.go`.

The CRC is stored as a **4-byte uint32 big-endian** (upper 2 bytes are always 0x0000).

---

## TCP ACK

After receiving a valid data packet, the server responds with a **4-byte big-endian uint32** containing the number of records received (equals Quantity1). A value of `0x00000000` signals a negative ACK (rejection).

---

## Hex Example (1 AVL record)

```
00000000          ← Preamble
00000036          ← Data Field Length (54 bytes)
08                ← Codec ID
01                ← Quantity1 = 1

  0000016B40D8EA30  ← Timestamp (ms since epoch)
  01                ← Priority = 1 (High)
  0F0F0F00          ← Longitude  (raw int32 → divide /10^7)
  0A0A0A00          ← Latitude   (raw int32 → divide /10^7)
  006F              ← Altitude = 111 m
  0001              ← Angle = 1°
  05                ← Satellites = 5
  0050              ← Speed = 80 km/h
  00                ← Event IO ID = 0
  04                ← N Total IO = 4
  01 01 F0          ← N1=1 → IO[1]=0xF0
  01 EF 00 04       ← N2=1 → IO[239]=4
  01 00 01 00 01 00 ← N4=1 → IO[1]=65537
  00                ← N8=0

01                ← Quantity2 = 1
00000000          ← CRC-16 (4 bytes, upper 2 always 0)
```

---

## Go Struct Mapping

| Wire field        | Go struct field                    | Type       |
|-------------------|------------------------------------|------------|
| Preamble          | `Codec8AvlRecord.Preamble`         | `uint32`   |
| Data Field Length | `Codec8AvlRecord.DataLength`       | `uint32`   |
| Codec ID          | `Codec8AvlRecord.CodecID`          | `uint8`    |
| Quantity1         | `Codec8AvlRecord.Quantity1`        | `uint8`    |
| Timestamp         | `AvlData.Timestamp` (Unix sec str) | `string`   |
| Priority          | `AvlData.Priority`                 | `uint8`    |
| Longitude         | `GPSelement.Longitude`             | `float64`  |
| Latitude          | `GPSelement.Latitude`              | `float64`  |
| Altitude          | `GPSelement.Altitude`              | `int16`    |
| Angle             | `GPSelement.Angle`                 | `uint16`   |
| Satellites        | `GPSelement.Satellites`            | `uint8`    |
| Speed             | `GPSelement.Speed`                 | `uint16`   |
| Event IO ID       | `IOelement.EventID`                | `int`      |
| N Total IO        | `IOelement.ElementCount`           | `int`      |
| IO elements       | `IOelement.Elements`               | `map[string]any` |
| Quantity2         | `Codec8AvlRecord.Quantity2`        | `uint8`    |
| CRC               | `Codec8AvlRecord.CRC`              | `uint32`   |

IO element map key = IO ID as decimal string (e.g. `"239"`). Values: N1/N2 → `int`, N4 → `int32`, N8 → `uint64` (or `string` if > uint32 max).
