-- ==============================================================================
-- UNIHACK 2026: Auth0 Security & MFA Audit Trail Schema
-- Sponsor Challenge: Best Use of Auth0 (Wireless Headphones Prize)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS core_auth_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sub VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    outcome VARCHAR(32) NOT NULL, -- 'ALLOW', 'CHALLENGE_MFA_REQUIRED', 'DENIED_INSUFFICIENT_ROLE'
    mfa_verified BOOLEAN NOT NULL DEFAULT FALSE,
    amr TEXT[] DEFAULT '{}',
    ip VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_sub_time ON core_auth_audit_events (sub, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_outcome ON core_auth_audit_events (outcome, recorded_at DESC);
