package tcp

import (
	"context"
	"fmt"
	"io"
	"net"
	"os"
	"strconv"
	"time"

	"go.uber.org/zap"
	"iotrack.live/internal/appcore"
	"iotrack.live/internal/apptypes"
	"iotrack.live/internal/logger"
)

type TCPServer struct {
	App *appcore.App
}

func NewTCPServer(app *appcore.App) *TCPServer {
	return &TCPServer{App: app}
}

func (s *TCPServer) Start(ctx context.Context) {
	port, err := strconv.Atoi(os.Getenv("TCP_PORT"))
	if err != nil {
		logger.Warn("TCP_PORT environment variable not set, using default 5027")
		port = 5027
	}

	// Start listening for incoming TCP connections on the specified port.
	ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		logger.Error("Failed to start TCP server", zap.Error(err))
		return
	}
	defer ln.Close()
	logger.Info("TCP server is listening", zap.Int("Port", port))

	// Wait for shutdown signal; closes listener to stop accepting new connections.
	go func() {
		<-ctx.Done()
		logger.Info("Context cancelled: shutting down TCP listener...")
		ln.Close() // This will unblock Accept() below.
	}()

	for {
		conn, err := ln.Accept() // Accept incoming connections
		if err != nil {
			select {
			case <-ctx.Done():
				logger.Info("Stopped accepting new TCP connections (shutdown in progress)")
				return
			default:
				logger.Error("Failed to accept TCP connection", zap.Error(err))
				continue
			}
		}
		// Handle each connection in its own goroutine for concurrency.
		go s.handleConnection(conn)
	}
}

func (s *TCPServer) handleConnection(conn net.Conn) {
	deviceMeta := apptypes.Meta{}
	defer conn.Close()
	defer s.handleTcpClose(&deviceMeta) // Optional: logs connection close for debugging.

	timeoutSec, err := strconv.Atoi(os.Getenv("TCP_TIMEOUT"))
	if err != nil {
		logger.Warn("TCP_TIMEOUT environment variable not set, using default 30s")
		timeoutSec = 30
	}

	// Set an initial timeout on the connection.
	conn.SetDeadline(time.Now().Add(time.Duration(timeoutSec) * time.Second))

	buf := make([]byte, 4096)
	for {
		n, err := conn.Read(buf)
		if err != nil {
			if os.IsTimeout(err) {
				s.handleTcpTimeout(&deviceMeta)
				return // Connection closed due to timeout
			}
			if err == io.EOF {
				s.handleTcpEnd(&deviceMeta)
				return // Connection closed by client
			}
			s.handleTcpError(&deviceMeta, err)
			return
		}

		// Reset deadline after successful read to keep connection alive.
		conn.SetDeadline(time.Now().Add(time.Duration(timeoutSec) * time.Second))

		// Process the received TCP data.
		s.handleTcpData(buf[:n], conn, &deviceMeta)
	}
}
