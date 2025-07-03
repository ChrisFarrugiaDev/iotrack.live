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



-- ---------------------------------------------------------------------
CREATE TABLE app.organizations (
    id              BIGSERIAL PRIMARY KEY,                  -- Dev/admin-friendly, internal PK
    uuid            UUID UNIQUE DEFAULT gen_random_uuid(),  -- Globally unique, use in APIs/relations

    name            VARCHAR(128) NOT NULL,
    description     TEXT,

    parent_org_id   BIGINT REFERENCES app.organizations(id) ON DELETE SET NULL,
    maps_api_key    VARCHAR(255),
    can_inherit_key BOOLEAN DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_name ON app.organizations (name);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON app.organizations
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


-- Root org (if not already present)
INSERT INTO app.organizations (uuid, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Root Org')
ON CONFLICT (uuid) DO NOTHING;

INSERT INTO app.organizations (uuid, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Archive Org')
ON CONFLICT (uuid) DO NOTHING;

-- ------------------------------------


CREATE TABLE app.assets (
    id                BIGSERIAL PRIMARY KEY,
    uuid              UUID UNIQUE DEFAULT gen_random_uuid(),
    organisation_uuid UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'
        REFERENCES app.organizations(uuid) ON DELETE SET DEFAULT,
    name              VARCHAR(128) NOT NULL,
    asset_type        VARCHAR(32),
    description       TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_organisation_uuid ON app.assets (organisation_uuid);
CREATE INDEX idx_assets_name ON app.assets (name);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON app.assets
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();



-- ------------------------------------

CREATE TABLE app.devices (
    id                BIGSERIAL PRIMARY KEY,
    uuid              UUID UNIQUE DEFAULT gen_random_uuid(),

    organisation_uuid UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'
        REFERENCES app.organizations(uuid) ON DELETE SET DEFAULT,

    asset_uuid        UUID REFERENCES app.assets(uuid) ON DELETE SET NULL,

    external_id       VARCHAR(64) NOT NULL,
    external_id_type  VARCHAR(16) NOT NULL,
    protocol          VARCHAR(32) NOT NULL,
    vendor            VARCHAR(64),
    model             VARCHAR(64),
    description       TEXT,
    registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes and triggers as before...
CREATE UNIQUE INDEX idx_devices_idtype_org ON app.devices (external_id, external_id_type);
CREATE UNIQUE INDEX idx_devices_uuid ON app.devices (uuid);
CREATE INDEX idx_devices_organisation_uuid ON app.devices (organisation_uuid);
CREATE INDEX idx_devices_asset_uuid ON app.devices (asset_uuid);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON app.devices
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


CREATE OR REPLACE FUNCTION check_device_asset_org_match()
RETURNS TRIGGER AS $$
BEGIN
    -- If asset_uuid is NOT NULL, check org UUIDs match
    IF NEW.asset_uuid IS NOT NULL THEN
        IF (SELECT organisation_uuid FROM app.assets WHERE uuid = NEW.asset_uuid) != NEW.organisation_uuid THEN
            RAISE EXCEPTION 'Device and assigned asset must belong to the same organization';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_device_asset_org_match
BEFORE INSERT OR UPDATE ON app.devices
FOR EACH ROW
EXECUTE FUNCTION check_device_asset_org_match();



-- ---------------------------------------------------------------------

CREATE TABLE teltonika.telemetry (
    id                BIGSERIAL,
    device_id         BIGINT NOT NULL,
    asset_id          BIGINT,
    organisation_id   BIGINT,
    timestamp         TIMESTAMPTZ NOT NULL,
    protocol          VARCHAR(32) NOT NULL,
    model             VARCHAR(64),
    telemetry         JSONB NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable (partitioned by timestamp)
SELECT create_hypertable('teltonika.telemetry', 'timestamp');

-- Useful indexes
CREATE INDEX idx_teltonika_telemetry_device_id ON teltonika.telemetry (device_id);
CREATE INDEX idx_teltonika_telemetry_asset_id ON teltonika.telemetry (asset_id);
CREATE INDEX idx_teltonika_telemetry_timestamp ON teltonika.telemetry (timestamp);

-- Enable compression
ALTER TABLE teltonika.telemetry SET (timescaledb.compress = true);

-- Compression settings (segment by device or asset)
ALTER TABLE teltonika.telemetry SET (timescaledb.compress_orderby = 'timestamp');
ALTER TABLE teltonika.telemetry SET (timescaledb.compress_segmentby = 'device_id');

-- Add a compression policy (example: compress rows older than 1 month)
SELECT add_compression_policy('teltonika.telemetry', INTERVAL '1 month');

-- Add a retention policy (example: drop rows older than 12 months)
SELECT add_retention_policy('teltonika.telemetry', INTERVAL '12 months');

-- Remove a retention policy (if needed)
-- SELECT remove_retention_policy('teltonika.telemetry');

