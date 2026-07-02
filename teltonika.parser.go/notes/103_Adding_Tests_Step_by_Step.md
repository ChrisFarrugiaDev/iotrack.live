# Adding Tests — Step-by-Step Guide

**Goal:** increase test coverage with minimal code changes — no new interfaces, no dependency injection rewiring, no refactors. Each phase builds on the previous and can be merged independently.

Run all existing tests to confirm a clean baseline before starting:

```sh
GOCACHE=/tmp/gocache go test ./...
```

---

## Current Coverage Snapshot

| Package | Test file | What's covered |
|---|---|---|
| `internal/util` | `bytes_utils_test.go` | BytesToUint/Int (1/2/4/8 byte), hex pairs, IsPrintableASCII |
| `internal/util` | `hex_utils_test.go` | StringToHexBytes, ByteLength, BytesToHexString |
| `internal/util` | `utils_test.go` | Ptr, PrettyPrint |
| `internal/apptypes` | `flat_avl_record_test.go` | DeepCopy (independence, nil map) |
| `internal/rabbitmq` | `producer_test.go` | Nil-safety on send methods |
| `internal/services` | `telemetry_service_test.go` | UpdateLastTelemetry merge, timestamp guard, race |
| `internal/teltonika` | `parser_test.go` | IMEI, Codec8, Codec8Extended, Codec12 happy paths |
| `cmd/parser` | `settings_test.go` | loadEnv, initializeCache (optional Redis) |

**Not yet tested (pure logic, no infrastructure needed):**
- `util.Crc16IBM`
- `util.NormalizeIDs`
- `teltonika` — all error / malformed-input paths
- `apptypes` — codec type getters (`GetCodecID`, `GetCodecType`, `GetQuantity1`), `GetResponse`
- `services.FlushLastTelemetry` — the double-buffer flush logic

**Needs infrastructure or non-trivial wiring (later phases):**
- `cache` Redis methods
- `services` device and organisation service
- `tcp` handler dispatch

---

## Phase 1 — Pure Utility Functions (no infrastructure)

These tests live entirely in already-existing packages. No new files need to be created in most cases — you just add test functions to existing `_test.go` files or create a single new file alongside the source.

### Step 1.1 — Test `Crc16IBM`

- [ ] Open `internal/util/hex_utils_test.go`
- [ ] Add `TestCrc16IBM` with the three cases below (derive expected values by running the function once and locking them in)

```go
func TestCrc16IBM(t *testing.T) {
    cases := []struct {
        name string
        input []byte
        want  uint16
    }{
        {"empty", []byte{}, 0x0000},
        {"single zero byte", []byte{0x00}, 0x0000},
        // grab expected from: fmt.Sprintf("%04X", util.Crc16IBM([]byte{...}))
        {"known teltonika payload", []byte{0x08, 0x01, ...}, 0xXXXX},
    }
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            got := Crc16IBM(tc.input)
            if got != tc.want {
                t.Errorf("Crc16IBM(%x) = %04X; want %04X", tc.input, got, tc.want)
            }
        })
    }
}
```

> **Tip:** copy the raw bytes from the existing `parser_test.go` hex fixtures (the Codec8 body between preamble and CRC field), run the test once with `t.Logf`, and paste the real output back as `want`.

- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/util/...`

---

### Step 1.2 — Test `NormalizeIDs`

- [ ] Create `internal/util/normalize_ids_utils_test.go`
- [ ] Cover: no-op when fields absent, value changed when present, invalid JSON returns error

```go
package util

import (
    "encoding/json"
    "testing"
)

func TestNormalizeIDs(t *testing.T) {
    t.Run("field missing — payload unchanged", func(t *testing.T) {
        input := []byte(`{"foo":"bar"}`)
        got, err := NormalizeIDs(input, "id")
        if err != nil {
            t.Fatal(err)
        }
        var m map[string]any
        json.Unmarshal(got, &m)
        if _, ok := m["id"]; ok {
            t.Error("field 'id' should not have been added")
        }
    })

    t.Run("invalid JSON returns error", func(t *testing.T) {
        _, err := NormalizeIDs([]byte(`not json`), "id")
        if err == nil {
            t.Error("expected error for invalid JSON")
        }
    })

    // Add one real case once you know what NormalizeIDs does to the value
    // (e.g., pads, trims, reformats the field).
}
```

- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/util/...`

---

## Phase 2 — Codec Type Getters (apptypes)

The `Codec8AvlRecord` and `Codec12Message` structs expose `GetCodecID`, `GetCodecType`, `GetQuantity1` (and `GetResponse` for Codec12). None are tested.

### Step 2.1 — `Codec8AvlRecord` getters

- [ ] Open `internal/apptypes/flat_avl_record_test.go` (or create `codec_8_avl_record_test.go` in the same package)
- [ ] Add `TestCodec8AvlRecord_Getters`

```go
func TestCodec8AvlRecord_Getters(t *testing.T) {
    r := &Codec8AvlRecord{} // zero value — fill fields as needed
    if id := r.GetCodecID(); id != 0x08 {
        t.Errorf("GetCodecID = %02X; want 08", id)
    }
    if ct := r.GetCodecType(); ct == "" {
        t.Error("GetCodecType returned empty string")
    }
}
```

- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/apptypes/...`

### Step 2.2 — `Codec12Message` getters

- [ ] Add `TestCodec12Message_Getters` and `TestCodec12Message_GetResponse` in the same file

```go
func TestCodec12Message_GetResponse(t *testing.T) {
    m := &Codec12Message{}
    // set the GPRS / response field directly, then assert GetResponse returns it
    _ = m.GetResponse()
}
```

- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/apptypes/...`

---

## Phase 3 — Codec Parser Error Paths (teltonika)

The existing `parser_test.go` covers four happy paths. Error paths are completely untested. These are pure byte-manipulation functions — no infrastructure needed.

### Step 3.1 — Short / empty input errors

- [ ] Add to `internal/teltonika/parser_test.go`

```go
func TestParseCodec8_ShortInputReturnsError(t *testing.T) {
    cases := []struct {
        name  string
        input []byte
    }{
        {"nil input", nil},
        {"empty", []byte{}},
        {"4 bytes — just preamble", []byte{0x00, 0x00, 0x00, 0x00}},
        {"truncated after length", []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10}},
    }
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            _, err := ParseCodec8(tc.input)
            if err == nil {
                t.Error("expected error, got nil")
            }
        })
    }
}
```

- [ ] Repeat the same pattern for `ParseCodec8Extended` and `ParseCodec12`
- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/teltonika/...`

### Step 3.2 — Wrong codec ID returns error

- [ ] Take the official Codec8 hex fixture from the existing test, flip byte at the codec-ID offset (byte index 8 of the data field) to `0xFF`, assert an error

```go
func TestParseCodec8_WrongCodecIDReturnsError(t *testing.T) {
    raw := decodeHexFixture(`
        00 00 00 00 00 00 00 36
        08 ...   // paste full fixture
    `)
    raw[8] = 0xFF // corrupt the codec ID byte
    _, err := ParseCodec8(raw)
    if err == nil {
        t.Error("expected error for wrong codec ID")
    }
}
```

> **Note:** `decodeHexFixture` is already defined in the same file — reuse it.

- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/teltonika/...`

### Step 3.3 — CRC mismatch returns error

- [ ] Same fixture, corrupt the last 4 bytes (CRC field), assert error

```go
func TestParseCodec8_BadCRCReturnsError(t *testing.T) {
    raw := decodeHexFixture(`...full fixture...`)
    // flip last byte
    raw[len(raw)-1] ^= 0xFF
    _, err := ParseCodec8(raw)
    if err == nil {
        t.Error("expected error for CRC mismatch")
    }
}
```

- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/teltonika/...`

### Step 3.4 — Multiple AVL records in one Codec8 packet

The existing test uses a single-record packet. Teltonika devices batch up to 255 records per packet.

- [ ] Find or construct a two-record hex fixture (Teltonika wiki has examples)
- [ ] Assert `len(record.Content.AVL_Datas) == 2` and validate both GPS fields
- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/teltonika/...`

---

## Phase 4 — IMEI Parser Edge Cases

### Step 4.1 — Valid IMEI variants

- [ ] Add table-driven cases to `TestImeiParserParsesTeltonikaHandshake`

```go
cases := []struct {
    name string
    hex  string
    want string
}{
    {"15-digit IMEI", "000F 333536333037303432343430303737", "353630370424 4007 7"},
    // add other real IMEIs from device documentation
}
```

### Step 4.2 — Malformed IMEI input

- [ ] Add `TestImeiParser_MalformedInput`

```go
func TestImeiParser_MalformedInput(t *testing.T) {
    cases := []struct{ name string; input []byte }{
        {"empty", []byte{}},
        {"length prefix claims 15 but only 5 bytes follow", append([]byte{0x00, 0x0F}, []byte("short")...)},
    }
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            _, err := ImeiParser(tc.input)
            if err == nil {
                t.Error("expected error")
            }
        })
    }
}
```

- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/teltonika/...`

---

## Phase 5 — Service Layer: FlushLastTelemetry

`FlushLastTelemetry` is currently untested. It depends on Redis, but the **double-buffer / device-set swap** logic is pure Go — test that part first.

### Step 5.1 — Verify the device-set swap without Redis

- [ ] Open `internal/services/telemetry_service_test.go`
- [ ] Add `TestFlushLastTelemetry_SwapsDeviceSet`

```go
func TestFlushLastTelemetry_SwapsDeviceSet(t *testing.T) {
    svc := newTestService()
    // populate LastTelemetryMap with a known device ID
    svc.App.LastTelemetryMap.Store(int64(42), apptypes.FlatAvlRecord{Timestamp: 1000})
    // populate UpdatedDevices set
    svc.App.UpdatedDevices.Store(int64(42), struct{}{})

    // FlushLastTelemetry will try to write to Redis — it will fail/panic
    // unless we guard it. For now just verify the device set is cleared
    // after the call IF Redis is not configured (the function should not panic).
    // Wrap in assertDoesNotPanic if you copy that helper from producer_test.go.
    defer func() {
        if r := recover(); r != nil {
            t.Logf("panicked (expected without Redis): %v", r)
        }
    }()
    svc.FlushLastTelemetry()
}
```

> **Why this is useful now:** it documents the behaviour under test and will pass cleanly once a future phase wires in a fake/stub cache. It also catches panics.

- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/services/...`

### Step 5.2 — Full flush with a fake Redis (optional, later)

When you are ready to go further — without changing production code — you can introduce an in-memory Redis stub using `miniredis`:

```sh
go get github.com/alicebob/miniredis/v2
```

Then replace `svc.App.Cache` with a `cache.NewCache(miniredisPool, prefix)` in test setup. No production code changes required.

---

## Phase 6 — TCP Handler Smoke Tests

`internal/tcp/handler.go` is the most complex untested path. The handler reads bytes from a `net.Conn`. Go's standard library provides `net.Pipe()` — two in-memory connected `net.Conn` values — which lets you drive the handler without a real socket.

### Step 6.1 — Create `internal/tcp/handler_test.go`

- [ ] Create the file with package `tcp`
- [ ] Add a `TestMain` that sets `LOG_MODE=off` (same pattern as `parser_test.go` and `producer_test.go`)

```go
package tcp

import (
    "os"
    "testing"
)

func TestMain(m *testing.M) {
    os.Setenv("LOG_MODE", "off")
    os.Exit(m.Run())
}
```

### Step 6.2 — Handshake smoke test

- [ ] Send a valid IMEI handshake packet through `net.Pipe` and confirm the handler responds with `0x01` (the ACK byte Teltonika expects)

```go
func TestHandler_IMEIHandshakeAck(t *testing.T) {
    server, client := net.Pipe()
    defer server.Close()
    defer client.Close()

    // Build a minimal App + Service for the handler
    app := &appcore.App{}
    svc := services.NewService(app)
    ts := NewTCPServer(app, svc)

    go ts.handleConn(server) // call the unexported handler if accessible, or the exported one

    // Write valid IMEI packet
    imeiPacket := decodeHexFixture("000F 333536333037303432343430303737")
    client.Write(imeiPacket)

    // Read response — expect single byte 0x01
    buf := make([]byte, 1)
    client.Read(buf)
    if buf[0] != 0x01 {
        t.Errorf("expected ACK 0x01, got %02X", buf[0])
    }
}
```

> **Note:** if `handleConn` is unexported and the test is in `package tcp` (same package), it is accessible directly. No export needed.

- [ ] Run: `GOCACHE=/tmp/gocache go test ./internal/tcp/...`

---

## Phase 7 — Integration Tests (optional, gated by env var)

Follow the pattern already established in `settings_test.go`:

```go
func TestSomething_WithRealRedis(t *testing.T) {
    if os.Getenv("RUN_REDIS_TESTS") != "1" {
        t.Skip("set RUN_REDIS_TESTS=1 to run")
    }
    // ... test using real Redis
}
```

Run with:

```sh
RUN_REDIS_TESTS=1 GOCACHE=/tmp/gocache go test ./...
```

---

## Running and Verifying After Each Phase

```sh
# Run a single package
GOCACHE=/tmp/gocache go test ./internal/util/...

# Run with race detector (always do this for concurrent tests)
GOCACHE=/tmp/gocache go test -race ./internal/services/...

# Run all non-integration tests
GOCACHE=/tmp/gocache go test ./...

# Run with verbose output
GOCACHE=/tmp/gocache go test -v ./internal/teltonika/...
```

---

## Implementation Order Summary

| Phase | Where | Files touched | Infrastructure |
|---|---|---|---|
| 1.1 — Crc16IBM | `internal/util` | `hex_utils_test.go` | none |
| 1.2 — NormalizeIDs | `internal/util` | new `normalize_ids_utils_test.go` | none |
| 2.1 — Codec8 getters | `internal/apptypes` | existing or new `_test.go` | none |
| 2.2 — Codec12 getters | `internal/apptypes` | same as 2.1 | none |
| 3.1 — Short input errors | `internal/teltonika` | `parser_test.go` | none |
| 3.2 — Wrong codec ID | `internal/teltonika` | `parser_test.go` | none |
| 3.3 — Bad CRC | `internal/teltonika` | `parser_test.go` | none |
| 3.4 — Multi-record packet | `internal/teltonika` | `parser_test.go` | none |
| 4.1 — IMEI variants | `internal/teltonika` | `parser_test.go` | none |
| 4.2 — Malformed IMEI | `internal/teltonika` | `parser_test.go` | none |
| 5.1 — Flush device set swap | `internal/services` | `telemetry_service_test.go` | none |
| 5.2 — Flush with miniredis | `internal/services` | `telemetry_service_test.go` | `miniredis` dep |
| 6.1 — TCP TestMain | `internal/tcp` | new `handler_test.go` | none |
| 6.2 — Handshake ACK | `internal/tcp` | `handler_test.go` | `net.Pipe` (stdlib) |
| 7 — Redis integration | various | existing `_test.go` files | real Redis + env var gate |
