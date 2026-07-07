package main

import (
	"encoding/base64"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
	"iotrack.live/teltonika.replay.go/internal/cache"
	"iotrack.live/teltonika.replay.go/internal/db"
	"iotrack.live/teltonika.replay.go/internal/logger"
	"iotrack.live/teltonika.replay.go/internal/models"
	"iotrack.live/teltonika.replay.go/internal/replay"
)

// ---------------------------------------------------------------------

// loadEnv loads environment variables from a .env file if not running in Docker.
var envPath = "./"

func loadEnv() error {

	os.Setenv("TZ", "UTC")

	// Check for DOCKERIZED (set as env in Docker Compose)
	if os.Getenv("DOCKERIZED") == "true" {
		// In Docker, assume envs are passed by Docker and skip loading .env files.
		return nil
	}

	env := os.Getenv("GO_ENV")
	var filename string

	switch env {
	case "production":
		filename = ".env"
	default:
		filename = ".env.development"
	}

	fullPath := fmt.Sprintf("%s%s", envPath, filename)
	err := godotenv.Load(fullPath)
	if err != nil {
		fmt.Printf("[envConfig] WARNING: Env file does not exist at: %s\n", fullPath)
	}

	return err
}

// ---------------------------------------------------------------------

func initializeCache() {
	// Initialize a Redis connection pool
	redisPool, err := cache.CreateRedisPool()
	if err != nil {
		logger.Error("Failed to connect to Redis", zap.Error(err))
		os.Exit(1)
	}
	port, _ := strconv.Atoi(os.Getenv("REDIS_PORT"))
	logger.Info("Successfully connected to Redis", zap.Int("Port", port))

	app.Cache = cache.NewCache(redisPool, "teltonika.parser.go:")
}

// ---------------------------------------------------------------------

func initializeDatabase() {
	// Initialize database connection
	dbPool, err := db.OpenDB()
	if err != nil {
		logger.Error("Error connecting to the database", zap.Error(err))
		os.Exit(1)
	}

	// Assign the database connection to the app configuration
	app.DB = dbPool

	// Initialize the application models using the database connection.
	app.Models, err = models.New(dbPool)
	if err != nil {
		logger.Error("Error initializing models", zap.Error(err))
	}
}

// ---------------------------------------------------------------------

// loadReplayConfig resolves the REPLAY_* environment variables into a
// replay.Config, validating REPLAY_DATA_DIR and REPLAY_START_FILE (§11-12).
func loadReplayConfig() (replay.Config, error) {
	dataDir := getenvDefault("REPLAY_DATA_DIR", "./data")

	startFile := os.Getenv("REPLAY_START_FILE")
	if startFile == "" {
		return replay.Config{}, fmt.Errorf("REPLAY_START_FILE is required")
	}
	if _, err := replay.ParseFileDate(startFile); err != nil {
		return replay.Config{}, fmt.Errorf("REPLAY_START_FILE: %w", err)
	}

	days, err := strconv.Atoi(os.Getenv("REPLAY_DAYS"))
	if err != nil || days <= 0 {
		return replay.Config{}, fmt.Errorf("REPLAY_DAYS must be a positive integer (got %q)", os.Getenv("REPLAY_DAYS"))
	}

	required := true
	if v := os.Getenv("REPLAY_WHITELIST_REQUIRED"); v != "" {
		required, err = strconv.ParseBool(v)
		if err != nil {
			return replay.Config{}, fmt.Errorf("REPLAY_WHITELIST_REQUIRED must be a bool: %w", err)
		}
	}
	wl := replay.NewWhitelist(os.Getenv("REPLAY_IMEI_WHITELIST"), required)
	if wl.Empty() && required {
		logger.Warn("REPLAY_IMEI_WHITELIST is empty and REPLAY_WHITELIST_REQUIRED=true: nothing will be replayed")
	}
	bl := replay.NewBlacklist(os.Getenv("REPLAY_IMEI_BLACKLIST"))

	lead := time.Hour
	if v := os.Getenv("REPLAY_PRELOAD_LEAD"); v != "" {
		lead, err = time.ParseDuration(v)
		if err != nil {
			return replay.Config{}, fmt.Errorf("REPLAY_PRELOAD_LEAD must be a duration: %w", err)
		}
	}

	onMissing := getenvDefault("REPLAY_ON_MISSING_FILE", replay.OnMissingSkip)
	if onMissing != replay.OnMissingSkip && onMissing != replay.OnMissingHalt {
		return replay.Config{}, fmt.Errorf("REPLAY_ON_MISSING_FILE must be %q or %q (got %q)", replay.OnMissingSkip, replay.OnMissingHalt, onMissing)
	}

	maxConc := 0
	if v := os.Getenv("REPLAY_MAX_CONCURRENT_DEVICES"); v != "" {
		maxConc, err = strconv.Atoi(v)
		if err != nil || maxConc < 0 {
			return replay.Config{}, fmt.Errorf("REPLAY_MAX_CONCURRENT_DEVICES must be a non-negative integer (got %q)", v)
		}
	}

	dataURL := os.Getenv("REPLAY_DATA_URL")
	if dataURL == "" {
		info, err := os.Stat(dataDir)
		if err != nil {
			return replay.Config{}, fmt.Errorf("REPLAY_DATA_DIR %q: %w", dataDir, err)
		}
		if !info.IsDir() {
			return replay.Config{}, fmt.Errorf("REPLAY_DATA_DIR %q is not a directory", dataDir)
		}
	}

	return replay.Config{
		DataDir:       dataDir,
		DataURL:       dataURL,
		StartFile:     startFile,
		Days:          days,
		PreloadLead:   lead,
		OnMissingFile: onMissing,
		Delimiter:     parseDelimiter(os.Getenv("REPLAY_CSV_DELIMITER")),
		Whitelist:     wl,
		Blacklist:     bl,
		MaxConcurrent: maxConc,
	}, nil
}

// loadMetaService builds a MetaService when REPLAY_META=true, or returns nil
// when disabled. REPLAY_META_ENCRYPTION_KEY must be a base64-encoded 32-byte
// AES key; generate one with: openssl rand -base64 32
func loadMetaService(db *pgxpool.Pool) (*replay.MetaService, error) {
	if !strings.EqualFold(os.Getenv("REPLAY_META"), "true") {
		return nil, nil
	}

	rawKey := os.Getenv("REPLAY_META_ENCRYPTION_KEY")
	if rawKey == "" {
		return nil, fmt.Errorf("REPLAY_META_ENCRYPTION_KEY is required when REPLAY_META=true")
	}
	keyBytes, err := base64.StdEncoding.DecodeString(rawKey)
	if err != nil {
		return nil, fmt.Errorf("REPLAY_META_ENCRYPTION_KEY must be base64-encoded: %w", err)
	}
	if len(keyBytes) != 32 {
		return nil, fmt.Errorf("REPLAY_META_ENCRYPTION_KEY must decode to exactly 32 bytes (got %d)", len(keyBytes))
	}
	var encKey [32]byte
	copy(encKey[:], keyBytes)

	flushEvery := time.Hour
	if v := os.Getenv("REPLAY_META_FLUSH_INTERVAL"); v != "" {
		flushEvery, err = time.ParseDuration(v)
		if err != nil {
			return nil, fmt.Errorf("REPLAY_META_FLUSH_INTERVAL must be a duration: %w", err)
		}
	}

	return replay.NewMetaService(db, encKey, flushEvery), nil
}

// parseDelimiter resolves the configured CSV delimiter, interpreting the literal
// escape "\t" (as it appears unquoted in .env) as a real tab (§3.2).
func parseDelimiter(v string) string {
	switch v {
	case "", `\t`, "\t":
		return "\t"
	default:
		return v
	}
}

// getenvDefault returns the env value for key, or def if unset/empty.
func getenvDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// ---------------------------------------------------------------------
