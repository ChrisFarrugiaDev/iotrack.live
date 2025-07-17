-- Set safe transaction isolation and enforce UTC for all timestamps
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SET TIMEZONE='UTC';

-- Enable TimescaleDB for advanced time-series management (if used elsewhere)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Make sure the pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;