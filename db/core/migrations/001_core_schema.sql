-- ===================================================
-- Core Schema: Users, Roles, Areas, Places, Notifications
-- Target: PostgreSQL / Tiger Cloud (TimescaleDB)
-- ===================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Users Table (Auth0 mapped)
CREATE TABLE IF NOT EXISTS core_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'resident',
    neighbourhood VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Areas / Neighbourhoods in Timișoara
CREATE TABLE IF NOT EXISTS core_areas (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    radius_meters INT NOT NULL DEFAULT 1500
);

-- 3. Saved Places (Addresses saved by residents)
CREATE TABLE IF NOT EXISTS core_saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core_users(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL, -- 'Home', 'Work', 'Dorm'
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    area_id VARCHAR(50) REFERENCES core_areas(id),
    notify_utilities BOOLEAN NOT NULL DEFAULT TRUE,
    notify_transit BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. In-App Notifications
CREATE TABLE IF NOT EXISTS core_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core_users(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    data JSONB,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Feature Flags
CREATE TABLE IF NOT EXISTS core_feature_flags (
    module_id VARCHAR(50) PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'beta', 'live'
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    min_role VARCHAR(50) NOT NULL DEFAULT 'resident'
);

-- 6. Events Outbox (for decoupled event bus)
CREATE TABLE IF NOT EXISTS core_events_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
