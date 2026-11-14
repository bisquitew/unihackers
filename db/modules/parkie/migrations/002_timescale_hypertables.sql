-- ==============================================================================
-- UNIHACK 2026: Tiger Data (TimescaleDB) Hypertable & Continuous Aggregates
-- Sponsor Challenge: Best Use of Tiger Data (Stream Deck Mini Prize)
-- PostgreSQL extended for real-time and time-series data:
-- - Hypertables (partitioned by timestamp)
-- - Continuous Aggregates (hourly rolled-up views)
-- - Real-Time Aggregates (materialized_only = false)
-- - Native Compression Policy (>90% compression)
-- - Data Retention Policies
-- ==============================================================================

-- 1. Ensure TimescaleDB extension is active
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 2. Convert parking_detection_events into a TimescaleDB Hypertable
SELECT create_hypertable(
    'parking_detection_events',
    by_range('recorded_at'),
    if_not_exists => TRUE
);

-- 3. City-wide Metric & Sensor Events Hypertable (Multi-module time-series)
CREATE TABLE IF NOT EXISTS city_metric_events (
    time TIMESTAMPTZ NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'air_quality_pm25', 'smell_intensity', 'noise_db', 'temperature_c'
    area_id VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64),            -- station_id, sensor_id
    value DOUBLE PRECISION NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

SELECT create_hypertable(
    'city_metric_events',
    by_range('time'),
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_city_metrics_type_time ON city_metric_events (metric_type, time DESC);
CREATE INDEX IF NOT EXISTS idx_city_metrics_area_time ON city_metric_events (area_id, time DESC);

-- 4. Utility Outages & Downtime Metrics Hypertable
CREATE TABLE IF NOT EXISTS utility_outage_metrics (
    recorded_at TIMESTAMPTZ NOT NULL,
    outage_id VARCHAR(64) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    area_id VARCHAR(50) NOT NULL,
    duration_hours DOUBLE PRECISION NOT NULL,
    affected_residents_estimate INT DEFAULT 0
);

SELECT create_hypertable(
    'utility_outage_metrics',
    by_range('recorded_at'),
    if_not_exists => TRUE
);

-- 5. Continuous Aggregate 1: Hourly Parking Occupancy Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS parking_hourly_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', recorded_at) AS bucket,
    lot_id,
    AVG(available_spots)::numeric(10,2) AS avg_available,
    AVG(detected_cars)::numeric(10,2) AS avg_occupied,
    MAX(detected_cars) AS peak_occupied,
    MIN(available_spots) AS min_available,
    COUNT(*) AS sample_count
FROM parking_detection_events
GROUP BY bucket, lot_id
WITH NO DATA;

-- Enable Real-Time Aggregates on parking continuous aggregate
ALTER MATERIALIZED VIEW parking_hourly_stats SET (timescaledb.materialized_only = false);

-- Continuous Aggregate Refresh Policy: refreshes every 15 minutes
SELECT add_continuous_aggregate_policy(
    'parking_hourly_stats',
    start_offset => INTERVAL '30 days',
    end_offset => INTERVAL '15 minutes',
    schedule_interval => INTERVAL '15 minutes',
    if_not_exists => TRUE
);

-- 6. Continuous Aggregate 2: Hourly Environmental & City Metrics Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS city_metrics_hourly_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    metric_type,
    area_id,
    AVG(value)::numeric(10,2) AS avg_value,
    MIN(value)::numeric(10,2) AS min_value,
    MAX(value)::numeric(10,2) AS max_value,
    COUNT(*) AS sample_count
FROM city_metric_events
GROUP BY bucket, metric_type, area_id
WITH NO DATA;

-- Enable Real-Time Aggregates on city metrics
ALTER MATERIALIZED VIEW city_metrics_hourly_stats SET (timescaledb.materialized_only = false);

-- Continuous Aggregate Refresh Policy for city metrics
SELECT add_continuous_aggregate_policy(
    'city_metrics_hourly_stats',
    start_offset => INTERVAL '30 days',
    end_offset => INTERVAL '15 minutes',
    schedule_interval => INTERVAL '15 minutes',
    if_not_exists => TRUE
);

-- 7. TimescaleDB Native Compression Policies (>90% compression)
-- Compresses historical sensor chunks older than 7 days
ALTER TABLE parking_detection_events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'lot_id',
    timescaledb.compress_orderby = 'recorded_at DESC'
);

SELECT add_compression_policy(
    'parking_detection_events',
    INTERVAL '7 days',
    if_not_exists => TRUE
);

ALTER TABLE city_metric_events SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'metric_type, area_id',
    timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy(
    'city_metric_events',
    INTERVAL '7 days',
    if_not_exists => TRUE
);

-- 8. Data Retention Policies (Automated lifecycle management)
SELECT add_retention_policy('parking_detection_events', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('city_metric_events', INTERVAL '90 days', if_not_exists => TRUE);
