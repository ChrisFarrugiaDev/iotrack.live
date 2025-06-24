
-- sudo -u postgres psql

CREATE DATABASE iotrack_live;



CREATE TABLE codec12_commands (
    id BIGSERIAL PRIMARY KEY,                          -- Fast, numeric auto-increment PK
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),        -- Globally unique, for APIs/distributed
    imei VARCHAR(20) NOT NULL,
    command TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMP,
    responded_at TIMESTAMP,
    response TEXT,
    retries INTEGER NOT NULL DEFAULT 0,
    comment TEXT
);

