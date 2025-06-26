-- Create application-level and Teltonika-specific schemas
CREATE SCHEMA app;           -- For global tables (users, assets, etc.)
CREATE SCHEMA teltonika;     -- For device/vendor-specific tables

-- Set safe transaction isolation and enforce UTC for all timestamps
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET TIMEZONE='UTC';

-- Enable TimescaleDB for advanced time-series management (if used elsewhere)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Utility function: automatically update 'updated_at' on any row update
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Main commands table for Teltonika Codec 12 messages (not a hypertable/time-series)
CREATE TABLE teltonika.codec12_commands (
    id BIGSERIAL PRIMARY KEY,                           -- Numeric primary key (auto-increment)
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),         -- Globally unique UUID for API/traceability
    imei VARCHAR(20) NOT NULL,                          -- Device IMEI (identifier)
    command TEXT NOT NULL,                              -- Codec 12 command content
    status VARCHAR(20) NOT NULL DEFAULT 'pending',      -- Command status (pending/sent/responded/failed)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),      -- Record creation time (in UTC)
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),               -- Updated time (auto-managed by trigger)
    sent_at TIMESTAMPTZ,                                -- When command was sent to device
    responded_at TIMESTAMPTZ,                           -- When device responded
    response TEXT,                                      -- Response content or status
    retries INTEGER NOT NULL DEFAULT 0,                 -- Retry count
    comment TEXT                                        -- Optional human-readable note
);

-- Attach a trigger to keep 'updated_at' current on every row update
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON teltonika.codec12_commands
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
