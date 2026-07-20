FROM alpine:latest

WORKDIR /app

# Copy the pre-built binary
COPY computation-server ./computation-server

EXPOSE 4004

# Start the service
ENTRYPOINT ["./computation-server"]
