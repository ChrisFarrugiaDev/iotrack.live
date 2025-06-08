package tcp

import (
	"fmt"
	"io"
	"net"
	"os"
	"strconv"
	"time"

	"go.uber.org/zap"
	"iotrack.live/internal/logger"
	"iotrack.live/internal/model"
)

func StartServer() {

	port, err := strconv.Atoi(os.Getenv("TCP_PORT"))

	if err != nil {
		logger.Warn("TCP_PORT environment variable not set")
		port = 5027
	}

	// Start listening on the specified TCP port
	ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))

	if err != nil {
		logger.Error("Failed to start TCP server", zap.Error(err))
		return
	}

	defer ln.Close()

	logger.Info("TCP Server Listening", zap.Int("Port", port))

	for {
		// Accept incoming connections
		conn, err := ln.Accept()

		if err != nil {
			logger.Error("Failed to accept TCP connection", zap.Error(err))
			continue // Try the next connection
		}

		// Handle the connection in a new goroutine
		go handleConnection(conn)
	}

}

func handleConnection(conn net.Conn) {
	deviceMeta := model.Meta{}

	defer conn.Close()
	defer handleTcpClose(&deviceMeta) // Optional, not need it only for Dev

	timeoutSec, err := strconv.Atoi(os.Getenv("TCP_TIMEOUT"))

	if err != nil {
		logger.Warn("TCP_TIMEOUT environment variable not set")
		timeoutSec = 30
	}

	// -- Set a timeout (optional, similar to setTimeout and 'timeout' event in Node)
	conn.SetDeadline(time.Now().Add(time.Duration(timeoutSec) * time.Second)) // 30s timeout

	buf := make([]byte, 4096)

	for {
		n, err := conn.Read(buf)

		if err != nil {
			if os.IsTimeout(err) {
				handleTcpTimeout(&deviceMeta)
				return // connection closed after timeout
			}

			if err == io.EOF {
				handleTcpEnd(&deviceMeta)
				return // connection closed by remote
			}

			handleTcpError(&deviceMeta, err)
			return
		}

		// -- Reset deadline after successful read!
		conn.SetDeadline(time.Now().Add(time.Duration(timeoutSec) * time.Second))

		// -- Process the data...
		handleTcpData(buf[:n], conn, &deviceMeta)
	}

}
