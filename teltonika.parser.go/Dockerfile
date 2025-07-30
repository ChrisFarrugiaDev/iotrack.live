# Stage 1: Build the Go binary
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Only copy go.mod/go.sum first to cache deps
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o teltonika-parser ./cmd/parser/.

# Stage 2: Minimal runtime image
FROM alpine:latest

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/teltonika-parser .

# (Optional) If you need config, copy it here:
# COPY config.yaml .

# If you need certificates for HTTPS, copy them here:
# COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 5027  

# Start the service
ENTRYPOINT ["./teltonika-parser"]
