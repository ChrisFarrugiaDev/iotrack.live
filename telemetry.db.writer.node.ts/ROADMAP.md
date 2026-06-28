# Telemetry DB Writer Roadmap

This file tracks recommended engineering work for `telemetry.db.writer.node.ts`.
The service consumes RabbitMQ telemetry from `teltonika.parser.go` and writes
durable telemetry state to PostgreSQL / TimescaleDB.

## Recommended Work

- [ ] Low priority - parked: document possible telemetry duplicate behavior.
  - The writer currently bulk inserts RabbitMQ telemetry as received.
  - RabbitMQ can redeliver a message after retry, reconnect, or ACK timing
    problems, so duplicate telemetry history rows are possible.
  - Do not change database schemas, Prisma schemas, migrations, or telemetry
    payload contracts for this item.
  - Revisit only if duplicate rows are observed in production, logs, or focused
    tests.
