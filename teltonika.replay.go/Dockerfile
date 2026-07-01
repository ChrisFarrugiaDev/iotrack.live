
FROM alpine:latest

WORKDIR /app

# Copy the binary from builder
COPY teltonika-replay ./teltonika-replay
COPY rabbitmq_config.json ./rabbitmq_config.json

# Start the service
ENTRYPOINT ["./teltonika-replay"]
