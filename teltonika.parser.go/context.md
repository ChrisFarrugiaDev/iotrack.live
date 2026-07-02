# Teltonika Parser Go — Complete Microservice Context

> **Purpose of this file**: Provide full context for LLM-assisted development sessions (ChatGPT, Claude, etc.). Contains every architectural decision, data contract, type definition, environment variable, Redis key schema, RabbitMQ topology, and code-level detail needed to reason about this service without access to the source files.

---

## 1. Service Identity

| Property | Value |
|----------|-------|
| Module | `iotrack.live/teltonika.parser.go` |
| Language | Go 1.23.1 |
| Binary | `teltonika-parser` |
| TCP Port | 5027 |
| Role | Teltonika GPS device TCP endpoint — parses Codec 8 / 8 Extended / 12 packets, forwards telemetry via RabbitMQ, maintains live state in Redis |
| Part of | `iotrack.live` platform (fleet/asset tracking SaaS) |

---

## 2. Directory Structure

```
teltonika.parser.go/
├── cmd/parser/
│   ├── main.go                    # Entry point: bootstrap, signal handling, graceful shutdown
│   ├── settings.go                # Env loading, Redis/DB init, device/org sync
│   ├── cron_jobs.go               # Scheduled tasks (latest telemetry flush)
│   └── settings_test.go           # Config + Redis integration tests
├── internal/
│   ├── appcore/
│   │   └── app.go                 # App struct — central state container
│   ├── apptypes/
│   │   ├── teltonika_packet.go    # TeltonikaPacket interface
│   │   ├── codec_8_avl_record.go  # Codec 8 parsed record structs
│   │   ├── codec_12_command.go    # Codec 12 command with lifecycle methods
│   │   ├── codec_12_message.go    # Codec 12 response struct
│   │   ├── flat_avl_record.go     # Flattened telemetry record (Redis/RabbitMQ payload)
│   │   ├── meta.go                # Connection metadata (IMEI)
│   │   └── flat_avl_record_test.go
│   ├── cache/
│   │   ├── redis.go               # Pool creation
│   │   ├── redis_basic.go         # Get, Set, Delete, Exists
│   │   ├── redis_hash.go          # Hash ops + Lua atomic scripts
│   │   ├── redis_list.go          # LPop (command queue)
│   │   ├── redis_set.go           # SAdd, SMembers, SAddLua
│   │   └── redis_publisher.go     # Pub/Sub publisher (background goroutine + channel)
│   ├── db/
│   │   └── db.go                  # pgxpool initialization
│   ├── logger/
│   │   └── logger.go              # Zap + lumberjack log rotation
│   ├── models/
│   │   ├── models.go              # Upper ORM session
│   │   ├── devices.go             # Device model, GetAllDevices, Create
│   │   └── organisation.go        # Organisation model, GetAll
│   ├── rabbitmq/
│   │   ├── rabbitmq.go            # Config loader (rabbitmq_config.json)
│   │   ├── producer.go            # Producer: connection monitor, SendDirectMessage, SendFanoutMessage
│   │   └── producer_test.go
│   ├── services/
│   │   ├── app_service.go         # Service wrapper
│   │   ├── telemetry_service.go   # UpdateLastTelemetry, FlushLastTelemetry
│   │   ├── device_service.go      # Device sync: DB → Redis → Memory
│   │   ├── organisation_service.go # Org sync: DB → Redis → Memory
│   │   └── telemetry_service_test.go
│   ├── tcp/
│   │   ├── server.go              # TCP listener, goroutine-per-connection
│   │   └── handler.go             # IMEI handshake, codec dispatch, Codec 12 lifecycle, publishing
│   ├── teltonika/
│   │   ├── parse_codec_8.go       # Codec 8 (0x08) parser
│   │   ├── parse_codec_8_extended.go # Codec 142 (0x8E) parser with NX elements
│   │   ├── parse_codec_12.go      # Codec 12 (0x0C) command/response parser
│   │   ├── imei_parser.go         # IMEI handshake parser
│   │   ├── helper_func.go         # Buffer bounds helpers
│   │   ├── IoElementsMap.go       # IO element ID → name mapping (700+ entries)
│   │   └── parser_test.go
│   └── util/
│       ├── utils.go               # Ptr[T](), PrettyPrint()
│       ├── bytes_utils.go         # BytesToUint8/16/32/64, IsPrintableASCII
│       ├── hex_utils.go           # CRC-16/IBM, hex encode/decode helpers
│       ├── normalize_ids_utils.go # JSON numeric field normalization
│       ├── bytes_utils_test.go
│       ├── hex_utils_test.go
│       └── utils_test.go
├── notes/                         # Dev notes (not committed to CI)
├── .agents/skills/                # Claude Code custom skills
├── .claude/                       # Claude Code settings
├── .vscode/                       # VS Code workspace settings
├── .env                           # Production environment
├── .env.development               # Development environment
├── Dockerfile                     # Alpine-based container
├── rabbitmq_config.json           # Exchange/queue/routing-key topology
├── go.mod
├── go.sum
├── AGENTS.md                      # Codex/Agent instructions
├── SPEC.md                        # Service specification document
├── ROADMAP.md                     # Feature roadmap
└── teltonika-parser               # Compiled binary (not in git)
```

---

## 3. Environment Variables

| Variable | Dev Value | Prod Value | Type | Purpose |
|----------|-----------|------------|------|---------|
| `DOCKERIZED` | (unset) | `true` | bool | When `true`, skip `.env` file loading (env vars injected by Docker Compose) |
| `GO_ENV` | `development` | `production` | string | Env mode flag |
| `LOG_MODE` | `default` | `file` | string | `default` \| `file` \| `off` |
| `LOG_FILE_PATH` | `./logs/teltonika_parser_go.log` | same | string | Log file path |
| `DEBUG` | `true` | `false` | bool | Enable debug-level logging |
| `TCP_PORT` | `5027` | `5027` | int | TCP listen port |
| `TCP_TIMEOUT` | `30` | `30` | int | Connection read timeout (seconds) |
| `LATEST_TELEMETRY_FLUSH_CRON` | `0,20,40 * * * * *` | same | string | Cron (every 20 sec) |
| `MICROSERVICE_NAME` | `teltonika.parser.go` | same | string | Service name (used in Redis key prefix) |
| `REDIS_HOST` | `127.0.0.1` | `127.0.0.1` | string | Redis host |
| `REDIS_PORT` | `6383` | `6383` | int | Redis port |
| `REDIS_PASSWORD` | `DevPass123!` | (secret) | string | Redis auth password |
| `REDIS_DB` | `2` | `2` | int | Redis logical database |
| `REDIS_CACHE_EXPIRE` | `3600` | `3600` | int | Default TTL seconds (-1 = persist) |
| `RABBITMQ_HOST` | `127.0.0.1` | `127.0.0.1` | string | RabbitMQ host |
| `RABBITMQ_PORT` | `5676` | `5676` | int | RabbitMQ AMQP port |
| `RABBITMQ_USER` | `devUser` | (secret) | string | RabbitMQ username |
| `RABBITMQ_PASSWORD` | `DevPass123!` | (secret) | string | RabbitMQ password |
| `DB_URL` | `postgresql://devUser:DevPass123!@127.0.0.1:5436/iotrack_live` | (secret) | string | PostgreSQL DSN |
| `DB_MAX_CONNS` | `8` | `20` | int | Pool max connections |
| `DB_MIN_CONNS` | `2` | `4` | int | Pool min connections |
| `DB_MAX_CONN_LIFETIME` | `1h` | `30m` | duration | Max connection age |
| `DB_MAX_CONN_IDLE_TIME` | `5m` | `5m` | duration | Idle connection timeout |

---

## 4. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `github.com/GoWebProd/uuid7` | `v0.0.0-20250513124731-a2de7bb12a24` | UUID v7 generation (time-ordered) |
| `github.com/GoWebProd/gip` | `v0.0.0-20230623090727-b60d41d5d320` | Generic pool utility |
| `github.com/gomodule/redigo` | `v1.9.2` | Redis client (connection pool) |
| `github.com/jackc/pgx/v5` | `v5.7.5` | PostgreSQL driver |
| `github.com/jackc/puddle/v2` | `v2.2.2` | Connection pool (used by pgx) |
| `github.com/joho/godotenv` | `v1.5.1` | `.env` file loading |
| `github.com/lib/pq` | `v1.10.9` | PostgreSQL driver (legacy/upper ORM) |
| `github.com/pkg/errors` | `v0.9.1` | Error wrapping |
| `github.com/rabbitmq/amqp091-go` | `v1.10.0` | RabbitMQ AMQP 0-9-1 client |
| `github.com/robfig/cron/v3` | `v3.0.0` | Cron scheduler |
| `github.com/segmentio/fasthash` | `v1.0.3` | Fast hashing |
| `github.com/upper/db/v4` | `v4.10.0` | ORM (used for Device/Organisation models) |
| `go.uber.org/zap` | `v1.27.0` | Structured logging |
| `go.uber.org/multierr` | `v1.10.0` | Multi-error composition |
| `golang.org/x/crypto` | `v0.37.0` | Crypto utilities |
| `golang.org/x/sync` | `v0.13.0` | `errgroup`, `semaphore` |
| `golang.org/x/text` | `v0.24.0` | Text encoding |
| `gopkg.in/natefinch/lumberjack.v2` | `v2.2.1` | Log file rotation |

---

## 5. Core Types & Structs

### 5.1 `appcore.App` — Central State Container

```go
type App struct {
    Cache                *RedisCache           // Redis connection pool wrapper
    Cron                 *cron.Cron            // Cron scheduler
    MQProducer           *RabbitMQProducer     // RabbitMQ producer
    DB                   *pgxpool.Pool         // PostgreSQL connection pool
    Models               Models                // Upper ORM session wrapper
    Devices              map[string]*Device    // IMEI → Device (in-memory)
    DevicesLock          sync.RWMutex
    Organisations        map[string]*Organisation
    OrganisationsLock    sync.RWMutex
    UUID                 *uuid7.Generator      // UUID v7 generator
    LastTsMap            map[int64]time.Time   // DeviceID → last telemetry timestamp
    LastTsLock           sync.RWMutex
    LastTelemetryMap     map[int64]FlatAvlRecord // DeviceID → latest FlatAvlRecord
    UpdatedDevices       map[int64]struct{}    // DeviceIDs updated since last flush
    LatestTelemetryLock  sync.Mutex            // Guards LastTelemetryMap + UpdatedDevices
    PubCh                chan<- PubMsg          // Send-only channel to Redis pub/sub goroutine
}
```

### 5.2 `models.Device`

```go
type Device struct {
    ID              int64
    UUID            string
    OrganisationID  int64
    AssetID         *int64
    ExternalID      string              // IMEI
    ExternalIDType  string              // always "imei"
    Protocol        string              // "4G" (set on new device creation)
    Vendor          *string
    Model           *string
    Status          string              // "new" | "active" | "disabled" | "retired"
    Attributes      map[string]interface{}
    LastTelemetry   map[string]interface{}
    LastTelemetryTs time.Time
    CreatedAt       time.Time
    UpdatedAt       time.Time
}
```

Device status constants:
```go
const (
    DeviceStatusNew      = "new"
    DeviceStatusActive   = "active"
    DeviceStatusDisabled = "disabled"
    DeviceStatusRetired  = "retired"
)
```

### 5.3 `models.Organisation`

```go
type Organisation struct {
    ID          int64
    UUID        string
    Name        string
    Status      string
    Attributes  map[string]interface{}
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

### 5.4 `apptypes.FlatAvlRecord` — Primary Telemetry Payload

```go
type FlatAvlRecord struct {
    Timestamp  string         // RFC3339 or Unix ms string
    Priority   uint8          // 0=low, 1=high, 2=panic
    Longitude  float64
    Latitude   float64
    Altitude   int16          // meters
    Angle      uint16         // degrees (0–360)
    Satellites uint8
    Speed      uint16         // km/h
    Elements   map[string]any // IO element name → value (from IoElementsMap)
}

func (r FlatAvlRecord) DeepCopy() FlatAvlRecord   // Returns independent copy
```

### 5.5 `apptypes.Codec8AvlRecord` — Parsed Codec 8 Packet

```go
type Codec8AvlRecord struct {
    Packet     string          // Raw hex string
    Preamble   uint32          // Always 0x00000000
    DataLength uint32
    CodecID    uint8           // 0x08
    CodecType  string          // "AVL_Data"
    Quantity1  uint8
    Content    Content         // { AVL_Datas []AvlData }
    Quantity2  uint8
    CRC        uint32
}

type AvlData struct {
    HappenedAt string          // Formatted timestamp
    Timestamp  string          // Raw Unix ms
    Priority   uint8
    GPSelement GPSelement
    IOelement  IOelement
}

type GPSelement struct {
    Longitude  float64
    Latitude   float64
    Altitude   int16
    Angle      uint16
    Satellites uint8
    Speed      uint16
}

type IOelement struct {
    EventIOID      uint8 | uint16  // (uint8 for C8, uint16 for C8E)
    EventIOName    string
    NumberOfTotal  uint8 | uint16
    N1Elements     []IOItem        // 1-byte value
    N2Elements     []IOItem        // 2-byte value
    N4Elements     []IOItem        // 4-byte value
    N8Elements     []IOItem        // 8-byte value
    NXElements     []IOItemX       // variable-length (C8E only)
}

type IOItem struct {
    ID    uint8 | uint16
    Name  string
    Value uint8 | uint16 | uint32 | uint64
}

type IOItemX struct {
    ID     uint16
    Name   string
    Length uint16
    Value  string    // hex-encoded bytes
}
```

### 5.6 `apptypes.Codec12Command` — GPRS Command

```go
type Codec12Command struct {
    ID          string         // UUID v7
    UUID        string         // same as ID
    IMEI        string
    Command     string         // e.g. "getver"
    Status      string         // "sent" | "completed" | "failed"
    CreatedAt   *time.Time
    SentAt      *time.Time
    RespondedAt *time.Time
    Response    string         // device response text
    Retries     int
    Comment     string
}

func (c *Codec12Command) ToPacket() []byte        // Encodes command as Codec 12 TCP packet
func (c *Codec12Command) SetToInflight(imei string) error  // Marks as sent
func (c *Codec12Command) SetToSync(status, response string) error  // Marks completed/failed
```

### 5.7 `apptypes.Codec12Message` — GPRS Response

```go
type Codec12Message struct {
    Preamble   uint32     // 0x00000000
    DataLength uint32
    CodecID    uint8      // 0x0C (12)
    Quantity1  uint8      // always 1
    Type       uint8      // 0x05=command, 0x06=response
    Size       uint32
    Text       string
    Quantity2  uint8      // always 1
    CRC        uint32
}
```

### 5.8 `apptypes.Meta` — Connection Metadata

```go
type Meta struct {
    IMEI string
}
```

### 5.9 `apptypes.TeltonikaPacket` — Interface

```go
type TeltonikaPacket interface {
    // Marker interface — implemented by Codec8AvlRecord and Codec12Message
}
```

### 5.10 `cache.RedisCache`

```go
type RedisCache struct {
    Conn   *redis.Pool
    Prefix string     // "teltonika.parser.go"
    mu     sync.Mutex
}
```

Key methods:
```go
// Basic
Get(key string) (string, error)
Set(key string, value interface{}, expireSeconds int) error
Delete(key string) error
Exists(key string) (bool, error)

// Hash
HGet(key, field string) (string, error)
HSet(key, field string, value interface{}) error
HGetAll(key string) (map[string]string, error)
HSetLua(key string, data map[string]string) error  // atomic replace via Lua

// List
LPop(key string) (string, error)

// Set
SAdd(key string, members ...interface{}) error
SMembers(key string) ([]string, error)
SAddLua(key string, member string) error  // atomic via Lua

// Pub/Sub
Publish(channel, message string) error
```

### 5.11 `rabbitmq.RabbitMQProducer`

```go
type RabbitMQProducer struct {
    config         RabbitMQConfig
    connection     *amqp.Connection
    channel        *amqp.Channel
    exchangesMap   map[string]Exchange
    queuesMap      map[string]Queue
    routingKeysMap map[string]RoutingKey
    UUID           *uuid7.Generator
}

func (p *RabbitMQProducer) SendDirectMessage(routingKey string, body []byte) error
func (p *RabbitMQProducer) SendFanoutMessage(exchange string, body []byte) error
```

---

## 6. Teltonika Protocol Specs

### 6.1 Codec IDs

| Codec | ID (hex) | ID (dec) | Purpose |
|-------|----------|----------|---------|
| Codec 8 | `0x08` | 8 | Basic AVL telemetry |
| Codec 8 Extended | `0x8E` | 142 | AVL with wider IO IDs and NX (variable-length) elements |
| Codec 12 | `0x0C` | 12 | GPRS command / response |

### 6.2 Packet Structure (Codec 8 / 8E)

```
[4 bytes] Preamble       = 0x00000000
[4 bytes] Data Length    = number of bytes from CodecID to end of records
[1 byte]  Codec ID       = 0x08 or 0x8E
[1 byte]  Number of Data (Quantity1)
[N bytes] AVL Data records (repeated)
[1 byte]  Number of Data (Quantity2)  = must equal Quantity1
[4 bytes] CRC-16/IBM     (covers CodecID through Quantity2)
```

Each AVL record:
```
[8 bytes] Timestamp      Unix ms (big-endian uint64)
[1 byte]  Priority       0=low, 1=high, 2=panic
[4 bytes] Longitude      integer × 10,000,000 → float64 degrees
[4 bytes] Latitude       integer × 10,000,000 → float64 degrees
[2 bytes] Altitude       meters (int16)
[2 bytes] Angle          degrees (uint16)
[1 byte]  Satellites     count
[2 bytes] Speed          km/h (uint16)
[IO element block]
```

IO element block (Codec 8):
```
[1 byte]  Event IO ID
[1 byte]  Total IO count
[1 byte]  N1 count  → N × (1B ID + 1B value)
[1 byte]  N2 count  → N × (1B ID + 2B value)
[1 byte]  N4 count  → N × (1B ID + 4B value)
[1 byte]  N8 count  → N × (1B ID + 8B value)
```

IO element block (Codec 8 Extended):
```
[2 bytes] Event IO ID    (uint16)
[2 bytes] Total IO count (uint16)
[2 bytes] N1 count  → N × (2B ID + 1B value)
[2 bytes] N2 count  → N × (2B ID + 2B value)
[2 bytes] N4 count  → N × (2B ID + 4B value)
[2 bytes] N8 count  → N × (2B ID + 8B value)
[2 bytes] NX count  → N × (2B ID + 2B length + [length]B value)
```

### 6.3 Codec 12 Packet Structure

```
[4 bytes] Preamble       = 0x00000000
[4 bytes] Data Length
[1 byte]  Codec ID       = 0x0C
[1 byte]  Quantity1      = 1
[1 byte]  Type           = 0x05 (command) | 0x06 (response)
[4 bytes] Command/Response Length
[N bytes] Command/Response text (ASCII)
[1 byte]  Quantity2      = 1
[4 bytes] CRC-16/IBM
```

### 6.4 CRC Calculation

Algorithm: CRC-16/IBM (polynomial 0xA001, reflected).
Input: bytes from CodecID through Quantity2 (inclusive).
Verified against Teltonika official test vectors.

### 6.5 TCP ACK / NACK

After IMEI handshake:
- Accept: `0x01` (1 byte)
- Reject: `0x00` (1 byte)

After Codec 8 / 8E data packet:
- ACK: 4-byte big-endian uint32 = number of records accepted (e.g. `0x00000005` for 5 records)

After Codec 12 command:
- No ACK sent; device response arrives as a new Codec 12 packet

---

## 7. TCP Server & Connection Handler

### 7.1 Server (`internal/tcp/server.go`)

- `net.Listen("tcp", ":5027")` — one goroutine per accepted connection
- Read buffer: 4096 bytes
- `conn.SetReadDeadline(now + TCP_TIMEOUT)` — reset on each successful read
- Graceful shutdown: context cancellation closes the listener; active connections drain

### 7.2 Handler (`internal/tcp/handler.go`) — Full Connection Lifecycle

```
1. Read first bytes → ParseIMEI()
2. Validate IMEI: lookup in App.Devices map (keyed by IMEI string)
   - Not found → create new Device in DB with status="new", cache to Redis, add to memory
   - Status "disabled" or "retired" → send NACK (0x00), close connection
3. Send ACK (0x01) → device proceeds to send data packets
4. Read loop:
   a. Detect Codec ID from byte offset [8] of packet
   b. Dispatch to ParseCodec8 / ParseCodec8Extended / ParseCodec12
   c. CRC validation
   d. For Codec 8 / 8E:
      - Check LastTsMap: reject records older than last received timestamp
      - Flatten AVL records → FlatAvlRecord
      - Publish to RabbitMQ (routing key: "teltonika_telemetry")
      - Update App.LastTelemetryMap and App.UpdatedDevices (under LatestTelemetryLock)
      - Publish to Redis pub/sub channel "teltonika:live"
      - Check Redis for pending Codec 12 command
      - If command pending: send Codec 12 command packet to device (replaces the telemetry ACK)
      - If no command: send TCP ACK (record count as 4-byte big-endian)
   e. For Codec 12 (response from device):
      - Match against inflight command in Redis
      - Set command status = "completed", store response text
      - Move to sync hash in Redis
```

### 7.3 Codec 12 Command Lifecycle

```
Backend writes command → Redis list (pending)
          ↓
Device connects / sends telemetry
          ↓
Handler: LPop from pending list
          ↓
SetToInflight: store in Redis inflight key, mark SentAt, Retries++
          ↓
Send command bytes to device (ToPacket())
          ↓
Device responds with Codec 12 response packet
          ↓
Handler: match response to inflight command
          ↓
SetToSync: status="completed", RespondedAt=now, Response=text
Move from inflight → sync hash
          ↓
(If Retries >= 10 with no response → status="failed", move to sync hash)
```

---

## 8. Redis Key Schema

All keys prefixed with `teltonika.parser.go:` unless noted.

| Key Pattern | Type | TTL | Content |
|------------|------|-----|---------|
| `teltonika.parser.go:device-latest-telemetry:<deviceID>` | String (JSON) | persist (-1) | Latest `FlatAvlRecord` JSON per device |
| `teltonika.parser.go:device-latest-telemetry:id` | Set | persist | Set of all device ID strings that have telemetry (index for downstream consumers) |
| `iotrack.live:devices` | Hash | persist | field=IMEI, value=Device JSON; atomic-replaced every 1 min |
| `iotrack.live:organisations` | Hash | persist | field=orgID, value=Organisation JSON; atomic-replaced every 1 min |
| `teltonika.parser.go:codec12:pending-commands:<imei>` | List | persist | Queue of `Codec12Command` JSON (LIFO, LPop from left) |
| `teltonika.parser.go:codec12:inflight-commands:<imei>` | String (JSON) | persist | Single in-flight `Codec12Command` |
| `teltonika.parser.go:codec12:sync-commands` | Hash | persist | field=commandID, value=`Codec12Command` JSON (completed/failed) |

Pub/Sub channel (not a stored key):
| Channel | Purpose |
|---------|---------|
| `teltonika:live` | Broadcasts latest `FlatAvlRecord` JSON for Socket.IO gateway |

---

## 9. RabbitMQ Topology

Defined in `rabbitmq_config.json`:

```json
{
  "reconnect_delay_seconds": 10,
  "exchanges": [
    { "name": "teltonika", "type": "direct", "durable": true }
  ],
  "queues": [
    { "name": "telemetry",       "durable": true, "type": "quorum"  },
    { "name": "tat240",          "durable": true, "type": "classic" },
    { "name": "command_status",  "durable": true, "type": "quorum"  }
  ],
  "routing_keys": [
    { "name": "teltonika_telemetry",      "exchange": "teltonika", "queue": "telemetry"      },
    { "name": "teltonika_tat240",         "exchange": "teltonika", "queue": "tat240"         },
    { "name": "teltonika_command_status", "exchange": "teltonika", "queue": "command_status" }
  ]
}
```

**Message format**: JSON-encoded `FlatAvlRecord` sent to `teltonika_telemetry` routing key on the `teltonika` direct exchange. Consumed by `telemetry.db.writer.node.ts` (separate microservice).

**Producer behaviour**: Persistent connection with channel monitoring. On channel/connection error, reconnects after `reconnect_delay_seconds`. `SendDirectMessage` publishes with `persistent` delivery mode (survives RabbitMQ restart).

---

## 10. Services

### 10.1 `telemetry_service.go`

```go
// Called from handler on each AVL packet (under LatestTelemetryLock):
func UpdateLastTelemetry(app *App, deviceID int64, record FlatAvlRecord)
// - Stores record in app.LastTelemetryMap[deviceID]
// - Adds deviceID to app.UpdatedDevices

// Called by cron every 20 seconds (under LatestTelemetryLock):
func FlushLastTelemetry(app *App)
// - For each deviceID in UpdatedDevices:
//   - Marshal record to JSON
//   - Redis SET "teltonika.parser.go:device-latest-telemetry:<id>" (no TTL)
// - Clears UpdatedDevices map
```

### 10.2 `device_service.go`

```go
// Startup + every 1 min:
func SyncDevicesToRedis(app *App) error
// - Fetches all devices from PostgreSQL (models.GetAllDevices)
// - Serializes to JSON map (IMEI → JSON)
// - Atomic hash replace in Redis ("iotrack.live:devices") via Lua script

// Every 20 sec:
func LoadDevicesFromRedis(app *App) error
// - HGetAll "iotrack.live:devices"
// - Deserializes and replaces app.Devices map (under DevicesLock)

// On unknown IMEI in handler:
func CreateDevice(app *App, imei string) (*Device, error)
// - Inserts new row in PostgreSQL with status="new", protocol="teltonika", external_id_type="imei"
// - Triggers re-sync to Redis + memory
```

### 10.3 `organisation_service.go`

Same pattern as device sync: DB → Redis hash → in-memory map, every 1 min / 20 sec.

---

## 11. Startup Sequence

```
1. Load .env (godotenv)
2. Initialize Zap logger (file or stdout, with lumberjack rotation)
3. Connect Redis (redigo pool)
4. Connect PostgreSQL (pgxpool)
5. Initialize Upper ORM session
6. Initialize UUID v7 generator
7. Connect RabbitMQ producer (with topology declaration)
8. SyncDevicesToRedis + LoadDevicesFromRedis
9. SyncOrganisationsToRedis + LoadOrganisationsFromRedis
10. Load latest telemetry from Redis → LastTelemetryMap
11. Start Redis pub/sub publisher goroutine (PubCh channel)
12. Start cron scheduler:
    - Every 20 sec: LoadDevicesFromRedis, LoadOrganisationsFromRedis, FlushLastTelemetry
    - Every 1 min: SyncDevicesToRedis, SyncOrganisationsToRedis
13. Start TCP server (port 5027)
14. Block on OS signal (SIGINT/SIGTERM)
15. Graceful shutdown: stop cron, close TCP listener, drain connections, close RabbitMQ, close Redis, close DB
```

---

## 12. Concurrency Model

| Resource | Protection |
|----------|-----------|
| `LastTelemetryMap` + `UpdatedDevices` | `sync.Mutex` (`LatestTelemetryLock`) — write from handler goroutines, read+clear from cron |
| `LastTsMap` | `sync.RWMutex` (`LastTsLock`) — write from handler, read from handler (timestamp dedup) |
| `Devices` map | `sync.RWMutex` (`DevicesLock`) — write from cron/create, read from handler |
| `Organisations` map | `sync.RWMutex` (`OrganisationsLock`) — write from cron, read from handler |
| Redis hash replace | Lua script (atomic server-side) — prevents partial reads during device/org sync |
| Redis pub/sub | Dedicated goroutine + unbuffered channel (`PubCh`) — handler sends, goroutine publishes |

---

## 13. Logging

- Library: `go.uber.org/zap` (structured, JSON in production)
- Rotation: `lumberjack` (size-based, configurable max size/backups/age)
- Modes:
  - `default`: stdout, human-readable
  - `file`: file at `LOG_FILE_PATH`
  - `off`: discard all output
- Fields always present: `microservice`, `go_env`, `timestamp`
- Debug logs gated on `DEBUG=true`

---

## 14. IO Elements Map

File: `internal/teltonika/IoElementsMap.go`

Maps IO element numeric ID (uint16) → human-readable name string. Contains 700+ entries covering:
- Digital inputs/outputs (DIN1–DIN4, DOUT1–DOUT2)
- Analog inputs (AIN1–AIN4)
- GSM/GNSS signal quality
- Movement, ignition, external voltage, battery
- CAN bus data (fuel level, RPM, odometer, etc.)
- Driver behavior events (harsh brake, acceleration, cornering)
- Bluetooth LE sensor readings
- TAT240-specific elements

Used by parser to attach human-readable names to IO values in `FlatAvlRecord.Elements`.

---

## 15. Utility Functions

### `util/bytes_utils.go`
```go
BytesToUint8(buf []byte, offset int) (uint8, int)
BytesToUint16(buf []byte, offset int) (uint16, int)
BytesToUint32(buf []byte, offset int) (uint32, int)
BytesToUint64(buf []byte, offset int) (uint64, int)
IsPrintableASCII(b []byte) bool
```

### `util/hex_utils.go`
```go
CRC16IBM(data []byte) uint16       // CRC-16/IBM for packet validation
HexToBytes(s string) ([]byte, error)
BytesToHex(b []byte) string
```

### `util/normalize_ids_utils.go`
```go
NormalizeNumericIDs(data map[string]any) map[string]any
// Converts JSON number fields that arrived as float64 to int64 where safe
```

### `util/utils.go`
```go
Ptr[T any](v T) *T                // Generic pointer helper
PrettyPrint(v any) string          // JSON-formatted debug output
```

---

## 16. Tests

| File | What it tests |
|------|--------------|
| `teltonika/parser_test.go` | Codec 8, 8E, 12, and IMEI parsing using official Teltonika hex test vectors |
| `services/telemetry_service_test.go` | UpdateLastTelemetry merge logic, timestamp dedup, concurrent access (race detector) |
| `rabbitmq/producer_test.go` | Nil producer/channel behaviour, no panic on send |
| `util/bytes_utils_test.go` | Big-endian binary conversions |
| `util/hex_utils_test.go` | CRC-16/IBM, hex encode/decode |
| `apptypes/flat_avl_record_test.go` | DeepCopy produces independent copy (no shared map reference) |
| `cmd/parser/settings_test.go` | Env loading, Redis connection (gated by `RUN_REDIS_TESTS=1`) |

Run commands:
```bash
go test ./...                          # All unit tests
go test -race ./internal/services      # With race detector
RUN_REDIS_TESTS=1 go test ./cmd/parser # Redis integration tests
```

---

## 17. Build & Deployment

### Build
```bash
go build -o teltonika-parser ./cmd/parser
```

### Dockerfile
```dockerfile
FROM alpine:latest
WORKDIR /app
COPY teltonika-parser ./teltonika-parser
COPY rabbitmq_config.json ./rabbitmq_config.json
EXPOSE 5027
ENTRYPOINT ["./teltonika-parser"]
```

Pre-built binary is copied into the Alpine container. No Go toolchain in the image.

### Docker run
```bash
docker build -t teltonika-parser:latest .
docker run -p 5027:5027 --env-file .env teltonika-parser:latest
```

---

## 18. Cron Jobs

| Schedule | Job |
|----------|-----|
| Every 20 sec (`0,20,40 * * * * *`) | `LoadDevicesFromRedis` — refresh in-memory device map from Redis |
| Every 20 sec | `LoadOrganisationsFromRedis` — refresh in-memory org map |
| Every 20 sec | `FlushLastTelemetry` — persist latest telemetry records to Redis |
| Every 1 min (`0 * * * * *`) | `SyncDevicesToRedis` — full DB → Redis device sync |
| Every 1 min | `SyncOrganisationsToRedis` — full DB → Redis org sync |

---

## 19. Platform Context

This microservice is one node in the `iotrack.live` fleet tracking platform:

```
Teltonika GPS Devices (TCP :5027)
        ↓
teltonika.parser.go          ← this service
        ↓ RabbitMQ (teltonika_telemetry)
telemetry.db.writer.node.ts  ← writes to PostgreSQL time-series
        ↓ Redis pub/sub (teltonika:live)
Socket.IO gateway             ← live map updates to browser clients
        ↓ Redis (iotrack.live:devices, organisations)
Other microservices           ← device management, auth, etc.
```

Backend services enqueue Codec 12 commands into Redis lists; this service delivers them to devices on next connection and routes responses back via the Redis `sync-commands` hash.

---

## 20. Contract Safety Principles (from AGENTS.md)

1. **Never break the RabbitMQ contract** — `FlatAvlRecord` JSON structure consumed by downstream services must not change without coordinated migration.
2. **Never break the Redis key schema** — key names and value formats are shared contracts with other microservices.
3. **TCP ACK format is device-protocol** — changing ACK byte format breaks all connected devices.
4. **CRC validation is mandatory** — never skip or soften CRC checks.
5. **Timestamp dedup is a safety feature** — `LastTsMap` prevents duplicate/replay records from reaching the database.
6. **Codec 12 lifecycle is stateful** — inflight/pending/sync states must remain consistent; never leave a command in an intermediate state on crash (Redis persistence covers recovery).

---

## 21. Commit Style (project convention)

- Conventional Commits format: `type: description`
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- No `Co-Authored-By` trailers (project-specific rule)
- Git user: Chris Farrugia

---

*Generated 2026-06-28 from full static analysis of teltonika.parser.go microservice.*
