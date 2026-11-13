-- Schema for M08_FORUM (Timișoara Community Hub)
CREATE SCHEMA IF NOT EXISTS m08_forum;

CREATE TABLE IF NOT EXISTS m08_forum.posts (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(32) NOT NULL, -- 'lost_pets', 'neighbourhood', 'help', 'buy_sell', 'cultural'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(64) NOT NULL,
    author_name VARCHAR(128) NOT NULL,
    neighbourhood VARCHAR(64) NOT NULL,
    photos JSONB DEFAULT '[]'::jsonb,
    upvotes INTEGER DEFAULT 0,
    is_reported BOOLEAN DEFAULT FALSE,
    report_count INTEGER DEFAULT 0,
    report_reasons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m08_forum.comments (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) REFERENCES m08_forum.posts(id) ON DELETE CASCADE,
    author_id VARCHAR(64) NOT NULL,
    author_name VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_category ON m08_forum.posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_neighbourhood ON m08_forum.posts(neighbourhood);
CREATE INDEX IF NOT EXISTS idx_forum_created_at ON m08_forum.posts(created_at DESC);
