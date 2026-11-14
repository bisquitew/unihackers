-- Schema for M10_ASSISTANT. Owner: P4. Not used yet: conversations are not stored today.
-- Placeholder for saving conversations later (e.g. for history across devices or quality review).
CREATE SCHEMA IF NOT EXISTS m10_assistant;

CREATE TABLE IF NOT EXISTS m10_assistant.conversations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),                          -- core.users id; null for guests
    language VARCHAR(2),                          -- 'ro' | 'en'
    turns JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{ "role": "user" | "model", "text": "...", "toolsUsed": [...] }]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user ON m10_assistant.conversations(user_id);
