
FROM alpine:latest

WORKDIR /app

# Copy the binary from builder
COPY teltonika-parser ./teltonika-parser
COPY rabbitmq_config.json ./rabbitmq_config.json

EXPOSE 5027  

# Start the service
ENTRYPOINT ["./teltonika-parser"]
