FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies for bimg
RUN apt-get update && apt-get install -y \
    libvips \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-built binary
COPY file-server ./file-server
RUN chmod +x ./file-server

EXPOSE 4002

# Start the service
ENTRYPOINT ["./file-server"]
