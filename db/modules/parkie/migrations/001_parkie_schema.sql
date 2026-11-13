-- ============================================================
-- UNIHACK 2026: PARKIE Real-time Parking Module Schema
-- Module: [PARKIE]
-- PostgreSQL + TimescaleDB
-- ============================================================

CREATE TYPE parking_status_color AS ENUM ('green', 'yellow', 'red', 'gray');

-- Parking Lots Table
CREATE TABLE IF NOT EXISTS parking_lots (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    camera_url TEXT,
    slots_data JSONB DEFAULT '[]'::jsonb,
    capacity INTEGER NOT NULL DEFAULT 50 CHECK (capacity >= 0),
    available_spots INTEGER NOT NULL DEFAULT 50 CHECK (available_spots >= 0),
    status_color parking_status_color NOT NULL DEFAULT 'green',
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_lots_coords ON parking_lots (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_parking_lots_status ON parking_lots (status_color, is_verified);

-- CV / Camera Detection Events History (TimescaleDB hypertable candidate)
CREATE TABLE IF NOT EXISTS parking_detection_events (
    id VARCHAR(64) DEFAULT gen_random_uuid(),
    lot_id VARCHAR(64) NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
    detected_cars INTEGER NOT NULL CHECK (detected_cars >= 0),
    available_spots INTEGER NOT NULL CHECK (available_spots >= 0),
    status_color parking_status_color NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (lot_id, recorded_at)
);

-- Seed Initial Timișoara Lots
INSERT INTO parking_lots (id, name, latitude, longitude, capacity, available_spots, status_color, is_verified)
VALUES
    ('lot-unirii-01', 'Piața Unirii Central', 45.7581, 21.2290, 45, 12, 'yellow', TRUE),
    ('lot-piata-700-02', 'Piața 700 Business', 45.7567, 21.2223, 110, 48, 'green', TRUE),
    ('lot-bega-center-03', 'Bega Business Center', 45.7541, 21.2312, 80, 4, 'yellow', TRUE),
    ('lot-continental-04', 'Parcare Hotel Continental', 45.7538, 21.2303, 150, 0, 'red', TRUE),
    ('lot-gara-nord-05', 'Gara de Nord Timișoara', 45.7505, 21.2081, 120, 65, 'green', TRUE),
    ('lot-craft-06', 'CRAFT Exhibition Center', 45.7482, 21.2401, 60, 22, 'green', TRUE),
    ('lot-uvt-headquarters-07', 'UVT Sediul Central', 45.7483, 21.2315, 40, 8, 'yellow', TRUE),
    ('lot-iulius-p2-08', 'Iulius Town - P2 Multi-level', 45.7680, 21.2280, 450, 180, 'green', TRUE),
    ('lot-iulius-p5-09', 'Iulius Town - P5 Open-air', 45.7675, 21.2320, 200, 95, 'green', TRUE),
    ('lot-shopping-city-10', 'Shopping City Timișoara South', 45.7275, 21.2114, 500, 260, 'green', TRUE)
ON CONFLICT (id) DO NOTHING;
