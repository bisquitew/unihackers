-- ===================================================
-- Module 04: Utilities Outage Schema
-- Colterm, Aquatim, Electricity & Gas Outages
-- ===================================================

CREATE TABLE IF NOT EXISTS m04_utilities_outages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL, -- 'colterm', 'aquatim', etc.
    type VARCHAR(50) NOT NULL, -- 'heating_and_hot_water', 'cold_water', etc.
    status VARCHAR(50) NOT NULL DEFAULT 'unplanned_breakdown', -- 'unplanned_breakdown', 'scheduled_maintenance', 'resolved'
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_areas TEXT[] NOT NULL DEFAULT '{}',
    affected_streets TEXT[] NOT NULL DEFAULT '{}',
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_restore_time TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    source_url TEXT,
    crowd_confirmations_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for searching affected areas
CREATE INDEX IF NOT EXISTS idx_m04_outages_areas ON m04_utilities_outages USING GIN(affected_areas);
CREATE INDEX IF NOT EXISTS idx_m04_outages_status ON m04_utilities_outages(status);

-- Crowd Confirmations
CREATE TABLE IF NOT EXISTS m04_outage_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outage_id UUID NOT NULL REFERENCES m04_utilities_outages(id) ON DELETE CASCADE,
    user_id UUID,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
