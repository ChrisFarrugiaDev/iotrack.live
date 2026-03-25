# iotrack.live

> **Work in Progress – Production-Oriented IoT Platform**

iotrack.live is a **modern IoT tracking and telemetry platform** designed around Teltonika devices.  
It is built as a **microservices-based system** with real-time processing, scalable ingestion, and clean separation of concerns.

This project also serves as a **technical showcase**, demonstrating backend architecture, real-time systems, and DevOps practices.

---

## Overview

iotrack.live provides:

- Real-time GPS tracking
- Device telemetry ingestion and processing
- Asset and device management
- Scalable event-driven architecture
- Live updates via WebSockets (Socket.IO)

The system is designed to handle **high-frequency IoT data streams** while maintaining both:

- **durable storage (PostgreSQL)**
- **low-latency real-time delivery (Redis / Socket.IO)**

---

## Architecture

![iotrack.live architecture](docs/architecture/iotrack-live-architecture.png)

### Key Layers

- **Client Layer**
  - `web.frontend.vue`

- **API / Realtime Layer**
  - `web.backend.node.ts.api`
  - `socketio.gateway.node.ts`
  - `file.server.go`

- **Processing Layer**
  - `teltonika.parser.go`
  - `telemetry.db.writer.node.ts`
  - `computation.server.go` *(in progress)*

- **Messaging Layer**
  - RabbitMQ (queue-based processing)
  - Redis Pub/Sub (real-time streaming)

- **Storage Layer**
  - PostgreSQL (persistent storage)
  - Redis (cache + live state + pub/sub)

---

## Main Technologies

### Backend
- **Golang** (high-performance services, parsers, computation)
- **Node.js (TypeScript)** (API, workers, real-time gateway)

### Frontend
- **Vue 3**
- **Vite**
- **SASS**

### Databases
- **PostgreSQL**
- **Redis**

### Messaging / Streaming
- **RabbitMQ**
- *(Kafka planned / experimental)*

### Realtime
- **Socket.IO**

### DevOps / Infrastructure
- **Docker**
- **Docker Compose**
- **Linux (Ubuntu)**
- **Bash scripting**

### ORM / Data Layer
- **Prisma (Node.js services)**

### Security
- **JWT Authentication**
- Role & permission-based access (in progress)

---

## Data Flow (Simplified)

1. **Teltonika devices → `teltonika.parser.go`**
2. Parser:
   - sends telemetry → **RabbitMQ → DB writer**
   - publishes live updates → **Redis Pub/Sub → Socket.IO**
3. **telemetry.db.writer.node.ts**
   - persists data into PostgreSQL
4. **socketio.gateway.node.ts**
   - pushes live updates to frontend clients
5. **web.backend.node.ts.api**
   - provides REST API (auth, assets, devices, etc.)
6. **web.frontend.vue**
   - consumes REST + WebSocket streams

---

## Microservices

| Service                          | Description |
|----------------------------------|------------|
| `teltonika.parser.go`            | Parses raw device data and dispatches events |
| `telemetry.db.writer.node.ts`    | Writes telemetry data to PostgreSQL |
| `socketio.gateway.node.ts`       | Real-time communication layer |
| `web.backend.node.ts.api`        | Main REST API |
| `file.server.go`                 | File handling service |
| `computation.server.go`          | Aggregations / analytics *(planned)* |
| `web.frontend.vue`               | Vue frontend |

---

## Project Goals

This project is built to demonstrate:

- Microservice architecture design
- Event-driven systems (RabbitMQ / Redis)
- Real-time data pipelines
- Clean separation of concerns
- Scalable backend patterns
- IoT protocol handling (Teltonika)
- Production-style Docker setups

---

## Deployment

The system is designed to run via:

```bash
docker-compose up --build
```

Services are containerized and can be scaled independently.

---
## Technical Deep Dive: 

### telemetry.db.writer.node.ts

#### TCP parser flow notes

#### `server.go`

##### `Start()`

The TCP server starts listening for incoming device connections on the configured port, which defaults to **5027**.  
**(ref_point 9000)**

When a device connects to the parser, the server accepts the connection.

Each accepted connection is handled in its own **goroutine**, so multiple devices can be served concurrently.  
**(ref_point 9001)**

---

##### `handleConnection()`

A timeout is set on the TCP connection.  
If the device stops sending packets without properly closing the connection, the read will time out and the connection will be closed.  
**(ref_point 9002)**

A **4096-byte buffer** is allocated once for this connection.

Because TCP connections can stay open and send multiple packets, the connection is read inside a loop until it ends.  
**(ref_point 9003)**

Each `Read()` reuses the same buffer and writes new incoming data from the start of the slice.  
The returned `n` tells us how many bytes were received, so `buf[:n]` gives us only the valid data from that read.

After every successful read, the connection deadline is reset to keep the session alive.

Finally, the received TCP data is passed to the packet handler.  
**(ref_point 9004)**

---

#### `handler.go`

##### `handleTcpData()`

The parser first checks the packet length.  
**(ref_point 9005)**

- If the packet is **17 bytes**, it is treated as the **IMEI handshake**
- Otherwise, it is treated as a **data packet**

A data packet can contain:

- **Codec 8 / Codec 8 Extended** telemetry data
- **Codec 12** command-related data

---

##### IMEI handshake flow

During the IMEI handshake, the parser tries to identify the device and populate `deviceMeta`.

`deviceMeta` is a local variable created once per TCP connection, and it stays available for the lifetime of that connection.

The parser first tries to find the device in the in-memory/cache layer.

If the device is not found, it is treated as a **new device**:

- create the device in the database
- cache it
- store it in memory
- populate `deviceMeta` with the device information  
    **(ref_point 9006)**

If the IMEI handshake fails, the parser responds with a **negative 1-byte ACK (`0x00`)**.

If it succeeds, the parser responds with a **positive 1-byte ACK (`0x01`)**.  
**(ref_point 9007)**

---

##### Data packet flow

If the packet is not an IMEI handshake, it is processed as a data packet.

The parser first retrieves the current device from the `app.Devices` map using the IMEI stored in `deviceMeta`.  
**(ref_point 9008)**

Then it reads the **codec ID** from the packet and parses the packet accordingly.

---

##### Codec 12 inflight command check

After parsing the packet, the parser checks whether there is an **inflight Codec 12 command** in cache for this device.  
**(ref_point 9009)**

An inflight command means the server has already sent a Codec 12 command to the device and is still waiting for the device’s response.

If an inflight command exists, the parser checks the parsed packet type.

###### If the packet type is `GPRS messages`

This means the device has replied to the Codec 12 command.

At this point, the inflight command can be removed from cache and marked as **completed**.

Later, completed commands should be synced to the database, probably through **RabbitMQ**, and then handled by another service such as `telemetry.db.writer.node.ts`.  
**(ref_point 9010)** (todo / in progress)

###### If the packet type is `AVL_Data`

This means the device sent telemetry data, but has not yet responded to the inflight Codec 12 command.

In that case, the parser retries sending the command again, up to **10 times**.

If all retries fail, the command is removed from the inflight cache and marked as **failed**.

This failed/completed command state should also likely be forwarded through **RabbitMQ** for async persistence.  
**(ref_point 9011)** (todo / in progress)

... to continue

---

## Future Improvements

- Replade RabbitMQ with Kafka (or Redpanda) integration (stream processing) 
- Advanced alerting system
- Analytics & aggregation engine
- Improved monitoring & observability (Prometheus / Grafana)
- Rewrite telemetry.db.writer.node.ts in go

---

## Author

Chris Farrugia  
Backend / Full-Stack Developer  

## License

This project is currently private / internal use.
