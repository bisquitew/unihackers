-- Schema for M11_FEEDBACK (Living Labs feedback + changelog). Owner: P4.
CREATE SCHEMA IF NOT EXISTS m11_feedback;

CREATE TABLE IF NOT EXISTS m11_feedback.entries (
    id VARCHAR(64) PRIMARY KEY,
    source VARCHAR(16) NOT NULL CHECK (source IN ('survey', 'in-app')),
    external_id VARCHAR(100),                 -- survey only: "survey-<row>" from the Google Sheet
    submitted_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    app_version VARCHAR(40) NOT NULL,
    app_rating SMALLINT CHECK (app_rating BETWEEN 1 AND 5),
    install_likelihood SMALLINT CHECK (install_likelihood BETWEEN 1 AND 5),
    module_id VARCHAR(40),                    -- in-app only; null = app in general
    text TEXT NOT NULL DEFAULT '',
    role VARCHAR(32),
    age_range VARCHAR(16),
    top_feature VARCHAR(40),
    wanted_features JSONB NOT NULL DEFAULT '[]'::jsonb,
    tried_app BOOLEAN,
    tried_parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    problem_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    survey_comments JSONB                     -- { "confusing": "...", "missing": "..." }
);

-- Retries from the sheet must not create duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_feedback_survey_external_id
    ON m11_feedback.entries(external_id) WHERE source = 'survey';
CREATE INDEX IF NOT EXISTS idx_feedback_app_version ON m11_feedback.entries(app_version);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted_at ON m11_feedback.entries(submitted_at DESC);

CREATE TABLE IF NOT EXISTS m11_feedback.changelog (
    version VARCHAR(40) PRIMARY KEY,
    hour SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 48),
    changed TEXT NOT NULL,
    because_of JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{ "ref": "LL-03", "summary": "..." }]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO m11_feedback.changelog (version, hour, changed)
VALUES ('v0', 0, 'Idea only, no app yet (baseline survey)')
ON CONFLICT (version) DO NOTHING;
