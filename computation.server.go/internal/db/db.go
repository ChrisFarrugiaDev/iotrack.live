package db

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func OpenDB() (*pgxpool.Pool, error) {
	// Get the database connection URL from the environment.
	dsn := os.Getenv("DB_URL")

	// Parse the connection string into a pgxpool configuration struct.
	poolConfig, err := pgxpool.ParseConfig(dsn)

	if err != nil {
		return nil, fmt.Errorf("failed to parse pool config: %w", err)
	}

	// Set some default fot the connection pool
	poolConfig.MaxConns = 8
	poolConfig.MinConns = 4
	poolConfig.MaxConnLifetime = 30 * time.Minute
	poolConfig.MaxConnIdleTime = 5 * time.Minute

	// Override pool settings from environment variables if provided.
	if v, err := strconv.Atoi(os.Getenv("DB_MAX_CONNS")); err == nil && v > 0 {
		poolConfig.MaxConns = int32(v)
	}

	if v, err := strconv.Atoi(os.Getenv("DB_MIN_CONNS")); err == nil && v > 0 {
		poolConfig.MinConns = int32(v)
	}
	if v, err := time.ParseDuration(os.Getenv("DB_MAX_CONN_LIFETIME")); err == nil && v > 0 {
		poolConfig.MaxConnLifetime = v
	}

	if v, err := time.ParseDuration(os.Getenv("DB_MAX_CONN_IDLE_TIME")); err == nil && v > 0 {
		poolConfig.MinConns = int32(v)
	}

	// Establish the connection pool.
	db, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed")
	}

	// Ping the database to verify the connection is working.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err = db.Ping(ctx); err != nil {
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	// Return pool
	return db, nil
}
