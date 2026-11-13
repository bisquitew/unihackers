-- Schema for M01_EVENTS (Timișoara Micro-events & Cultural Calendar)
CREATE SCHEMA IF NOT EXISTS m01_events;

CREATE TABLE IF NOT EXISTS m01_events.events (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(32) NOT NULL, -- 'cinema', 'music', 'workshop', 'showcase', 'social'
    location_name VARCHAR(128) NOT NULL,
    address VARCHAR(255) NOT NULL,
    neighbourhood VARCHAR(64) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    date_time TIMESTAMPTZ NOT NULL,
    age_group VARCHAR(32) DEFAULT 'all',
    organizer_name VARCHAR(128) NOT NULL,
    organizer_contact VARCHAR(128),
    attendee_count INTEGER DEFAULT 0,
    max_capacity INTEGER,
    is_free BOOLEAN DEFAULT TRUE,
    price_amount NUMERIC(10, 2),
    audio_digest_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m01_events.rsvps (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) REFERENCES m01_events.events(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    user_wallet VARCHAR(128),
    solana_ticket_sig VARCHAR(128),
    looking_for_buddy BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_category ON m01_events.events(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON m01_events.events(date_time);
CREATE INDEX IF NOT EXISTS idx_events_neighbourhood ON m01_events.events(neighbourhood);
