-- Schema for M07_BUDDY (Timișoara Event Buddy & "Cu Cine?" Finder)
CREATE SCHEMA IF NOT EXISTS m07_buddy;

CREATE TABLE IF NOT EXISTS m07_buddy.buddy_requests (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    bio TEXT,
    university VARCHAR(128),
    interests JSONB DEFAULT '[]'::jsonb,
    icebreaker_prompt TEXT,
    status VARCHAR(32) DEFAULT 'open',
    matched_with JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m07_buddy.chats (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    participant_ids JSONB DEFAULT '[]'::jsonb,
    participant_names JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS m07_buddy.chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    chat_id VARCHAR(64) REFERENCES m07_buddy.chats(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buddy_event ON m07_buddy.buddy_requests(event_id);
