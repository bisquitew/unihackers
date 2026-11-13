-- ===================================================
-- Module 05: Transit Detours Schema
-- STPT Tram & Bus Detours, Suspended Lines, 2026 Roadworks
-- ===================================================

CREATE TABLE IF NOT EXISTS m05_transit_lines (
    id VARCHAR(50) PRIMARY KEY,
    line_number VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'tram', 'bus', 'trolleybus'
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'normal', -- 'normal', 'detoured', 'suspended', 'temporary_replacement'
    current_route_summary TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m05_detour_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_number VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    affected_stops TEXT[] NOT NULL DEFAULT '{}',
    alternative_instructions TEXT NOT NULL,
    replacement_line VARCHAR(20),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_m05_alerts_stops ON m05_detour_alerts USING GIN(affected_stops);
