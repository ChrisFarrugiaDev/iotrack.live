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

-- ---------------------------------------------------------------------------------------------------------------------

CREATE TABLE app.organisations (
    id              BIGSERIAL PRIMARY KEY,                  -- Dev/admin-friendly, internal PK
    uuid            UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),  -- Globally unique, use in APIs/relations

    name            VARCHAR(128) NOT NULL,
    description     TEXT,

    parent_org_id   BIGINT REFERENCES app.organisations(id),
    maps_api_key    VARCHAR(255),
    can_inherit_key BOOLEAN DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organisations_name ON app.organisations (name);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON app.organisations
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


-- Root organisation (id=1, parent NULL)
INSERT INTO app.organisations (id, uuid, name, parent_org_id)
VALUES
  (1, '11111111-1111-1111-1111-111111111111', 'Root Org', NULL)
ON CONFLICT (id) DO NOTHING;

-- Archive org (id=2, child of root)
INSERT INTO app.organisations (id, uuid, name, parent_org_id)
VALUES
  (2, '22222222-2222-2222-2222-222222222222', 'Archive Org', 1)
ON CONFLICT (id) DO NOTHING;



-- ---------------------------------------------------------------------------------------------------------------------


CREATE TABLE app.assets (
    id                BIGSERIAL PRIMARY KEY,
    uuid              UUID UNIQUE DEFAULT gen_random_uuid(),
    organisation_id   BIGINT NOT NULL DEFAULT 2 REFERENCES app.organisations(id) ON DELETE SET DEFAULT,   
    name              VARCHAR(128) NOT NULL,
    asset_type        VARCHAR(32),
    description       TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_organisation_id ON app.assets (organisation_id);
CREATE INDEX idx_assets_name ON app.assets (name);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON app.assets
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();



-- ---------------------------------------------------------------------------------------------------------------------
-- create the ENUM type for status

-- CREATE TYPE device_status AS ENUM ('new', 'active', 'disabled', 'retired');

CREATE TABLE app.devices (
    id                BIGSERIAL PRIMARY KEY,
    uuid              UUID UNIQUE DEFAULT gen_random_uuid(),

    organisation_id   BIGINT NOT NULL DEFAULT  2 REFERENCES app.organisations(id)  ON DELETE SET DEFAULT, 

    asset_id          BIGINT REFERENCES app.assets(id) ON DELETE SET NULL,
    
    external_id       VARCHAR(64) NOT NULL,
    external_id_type  VARCHAR(16) NOT NULL,
    protocol          VARCHAR(32),
    vendor            VARCHAR(64),
    model             VARCHAR(64),
    status VARCHAR CHECK (status IN ('new', 'active', 'disabled', 'retired')) NOT NULL DEFAULT 'new',
    description       TEXT,
    registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes and triggers as before...
CREATE UNIQUE INDEX idx_devices_idtype_org ON app.devices (external_id, external_id_type);
CREATE UNIQUE INDEX idx_devices_uuid ON app.devices (uuid);
CREATE INDEX idx_devices_status ON app.devices (status);



CREATE TRIGGER set_updated_at
BEFORE UPDATE ON app.devices
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_check_device_asset_org_match
BEFORE INSERT OR UPDATE ON app.devices
FOR EACH ROW
EXECUTE FUNCTION check_device_asset_org_match();



-- ---------------------------------------------------------------------------------------------------------------------

CREATE TABLE app.telemetry (
    id                BIGSERIAL,
    device_id         BIGINT NOT NULL,
    asset_id          BIGINT,
    organisation_id   BIGINT,
    timestamp         TIMESTAMPTZ NOT NULL,
    protocol          VARCHAR(32) NOT NULL,
    vendor            VARCHAR(64),
    model             VARCHAR(64),
    telemetry         JSONB NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable (partitioned by timestamp)
SELECT create_hypertable('app.telemetry', 'timestamp');

-- Useful indexes
CREATE INDEX idx_teltonika_telemetry_device_id ON app.telemetry (device_id);
CREATE INDEX idx_teltonika_telemetry_asset_id ON app.telemetry (asset_id);
CREATE INDEX idx_teltonika_telemetry_timestamp ON app.telemetry (timestamp);

-- Enable compression
ALTER TABLE app.telemetry SET (timescaledb.compress = true);

-- Compression settings (segment by device or asset)
ALTER TABLE app.telemetry SET (timescaledb.compress_orderby = 'timestamp');
ALTER TABLE app.telemetry SET (timescaledb.compress_segmentby = 'device_id');

-- Add a compression policy (example: compress rows older than 1 month)
SELECT add_compression_policy('app.telemetry', INTERVAL '1 month');

-- Add a retention policy (example: drop rows older than 12 months)
SELECT add_retention_policy('app.telemetry', INTERVAL '12 months');

-- Remove a retention policy (if needed)
-- SELECT remove_retention_policy('teltonika.telemetry');

