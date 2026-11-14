-- ==============================================================================
-- M03_SAFETY: residents' reports about how safe places feel, as a Tiger Data (TimescaleDB) hypertable. Owner: P4.
-- Same approach as db/modules/m06-smell/migrations/0001_init_smell.sql:
-- - Hypertable partitioned by created_at
-- - Hourly continuous aggregate per area and report type (real-time aggregates on)
-- - Native compression policy and a retention policy
-- Reports describe places, never people; notes are short and stripped of contact details by the API.
-- Demo reports (seed.ts) are generated in the API and never stored here.
-- ==============================================================================

-- 1. Ensure TimescaleDB extension is active
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE SCHEMA IF NOT EXISTS m03_safety;

-- 2. Reports table (the partition column must be part of the primary key in a hypertable)
CREATE TABLE IF NOT EXISTS m03_safety.reports (
    id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type VARCHAR(24) NOT NULL
        CHECK (type IN ('poor_lighting', 'noise_at_night', 'abandoned_building', 'feeling_unsafe', 'other')),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    area_id VARCHAR(50) NOT NULL,             -- core area id, e.g. 'area-gara'
    note VARCHAR(200),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id, created_at)
);

-- 3. Convert into a TimescaleDB Hypertable
SELECT create_hypertable(
    'm03_safety.reports',
    by_range('created_at'),
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_safety_area_time ON m03_safety.reports (area_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_type_time ON m03_safety.reports (type, created_at DESC);

-- 4. Continuous Aggregate: hourly reports per area and type
CREATE MATERIALIZED VIEW IF NOT EXISTS m03_safety.reports_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', created_at) AS bucket,
    area_id,
    type,
    COUNT(*) AS report_count
FROM m03_safety.reports
WHERE is_demo = FALSE
GROUP BY bucket, area_id, type
WITH NO DATA;

-- Enable Real-Time Aggregates, so the last hour is included before it is materialized
ALTER MATERIALIZED VIEW m03_safety.reports_hourly SET (timescaledb.materialized_only = false);

-- Refresh every 15 minutes
SELECT add_continuous_aggregate_policy(
    'm03_safety.reports_hourly',
    start_offset => INTERVAL '30 days',
    end_offset => INTERVAL '15 minutes',
    schedule_interval => INTERVAL '15 minutes',
    if_not_exists => TRUE
);

-- 5. Native compression for chunks older than 7 days
ALTER TABLE m03_safety.reports SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'area_id, type',
    timescaledb.compress_orderby = 'created_at DESC'
);

SELECT add_compression_policy(
    'm03_safety.reports',
    INTERVAL '7 days',
    if_not_exists => TRUE
);

-- 6. Data retention (same lifetime as the other city reports)
SELECT add_retention_policy('m03_safety.reports', INTERVAL '90 days', if_not_exists => TRUE);
