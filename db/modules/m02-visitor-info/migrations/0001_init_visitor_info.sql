-- Schema for M02_VISITOR_INFO (practical info for visitors, RO + EN). Owner: P4.
-- Content comes from docs/visitor-info/content.md (see services/api/src/modules/m02-visitor-info/seed.ts).
CREATE SCHEMA IF NOT EXISTS m02_visitor_info;

CREATE TABLE IF NOT EXISTS m02_visitor_info.entries (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(32) NOT NULL
        CHECK (category IN ('emergency', 'transport', 'arrival', 'tourist-info', 'money', 'city-alerts')),
    verify BOOLEAN NOT NULL DEFAULT FALSE,    -- price or schedule that changes: "check before you travel"
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    checked DATE NOT NULL,
    ro_title TEXT NOT NULL,
    ro_text TEXT NOT NULL,
    en_title TEXT NOT NULL,
    en_text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visitor_info_category ON m02_visitor_info.entries(category);
