-- ==============================================================================
-- M06_SMELL: community smell reports as a Tiger Data (TimescaleDB) hypertable. Owner: P4.
-- Same approach as db/modules/parkie/migrations/002_timescale_hypertables.sql:
-- - Hypertable partitioned by created_at
-- - Hourly continuous aggregate per area and smell type (real-time aggregates on)
-- - Native compression policy and a retention policy
-- Demo reports (seed.ts) are generated in the API and never stored here.
-- ==============================================================================

-- 1. Ensure TimescaleDB extension is active
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE SCHEMA IF NOT EXISTS m06_smell;

-- 2. Reports table (the partition column must be part of the primary key in a hypertable)
CREATE TABLE IF NOT EXISTS m06_smell.reports (
    id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('burnt_rubber', 'smoke', 'sewage', 'chemical', 'garbage', 'other')),
    intensity SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 5),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    area_id VARCHAR(50) NOT NULL,             -- core area id, e.g. 'area-fabric'
    note VARCHAR(300),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id, created_at)
);

-- 3. Convert into a TimescaleDB Hypertable
SELECT create_hypertable(
    'm06_smell.reports',
    by_range('created_at'),
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_smell_area_time ON m06_smell.reports (area_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smell_type_time ON m06_smell.reports (type, created_at DESC);

-- 4. Continuous Aggregate: hourly reports per area and smell type
CREATE MATERIALIZED VIEW IF NOT EXISTS m06_smell.reports_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', created_at) AS bucket,
    area_id,
    type,
    COUNT(*) AS report_count,
    AVG(intensity)::numeric(4,2) AS avg_intensity,
    MAX(intensity) AS max_intensity
FROM m06_smell.reports
WHERE is_demo = FALSE
GROUP BY bucket, area_id, type
WITH NO DATA;

-- Enable Real-Time Aggregates, so the last hour is included before it is materialized
ALTER MATERIALIZED VIEW m06_smell.reports_hourly SET (timescaledb.materialized_only = false);

-- Refresh every 15 minutes
SELECT add_continuous_aggregate_policy(
    'm06_smell.reports_hourly',
    start_offset => INTERVAL '30 days',
    end_offset => INTERVAL '15 minutes',
    schedule_interval => INTERVAL '15 minutes',
    if_not_exists => TRUE
);

-- 5. Native compression for chunks older than 7 days
ALTER TABLE m06_smell.reports SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'area_id, type',
    timescaledb.compress_orderby = 'created_at DESC'
);

SELECT add_compression_policy(
    'm06_smell.reports',
    INTERVAL '7 days',
    if_not_exists => TRUE
);

-- 6. Data retention (same lifetime as P2's city metrics)
SELECT add_retention_policy('m06_smell.reports', INTERVAL '90 days', if_not_exists => TRUE);
