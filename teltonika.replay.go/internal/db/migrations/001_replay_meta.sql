-- Migration: create replay_meta schema
-- Applied automatically by MetaService.EnsureSchema() at startup when REPLAY_META=true.
-- This file is kept as a reference; you do not need to run it manually.

CREATE SCHEMA IF NOT EXISTS replay_meta;

-- Reverse-lookup table: real IMEIs are never stored in plaintext.
--   masked_imei         — the fake IMEI used everywhere downstream (PK)
--   real_imei_hash      — hex(SHA-256(real IMEI)), used for deterministic upsert/dedup
--   real_imei_encrypted — AES-256-GCM ciphertext (base64), decryptable with REPLAY_META_ENCRYPTION_KEY
CREATE TABLE IF NOT EXISTS replay_meta.imei_map (
    masked_imei         TEXT        PRIMARY KEY,
    real_imei_hash      TEXT        NOT NULL UNIQUE,
    real_imei_encrypted TEXT        NOT NULL,
    first_seen          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only log: one row per file loaded (day rotation).
CREATE TABLE IF NOT EXISTS replay_meta.replay_progress (
    id           BIGSERIAL   PRIMARY KEY,
    file_name    TEXT        NOT NULL,
    day_index    INT         NOT NULL,
    replay_days  INT         NOT NULL,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
