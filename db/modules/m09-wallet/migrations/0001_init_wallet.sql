-- Schema for M09_WALLET (Solana Devnet Tickets & POAP)
CREATE SCHEMA IF NOT EXISTS m09_wallet;

CREATE TABLE IF NOT EXISTS m09_wallet.tickets (
    ticket_id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    owner_wallet VARCHAR(128) NOT NULL,
    attendee_name VARCHAR(128) NOT NULL,
    tx_signature VARCHAR(128) NOT NULL,
    explorer_url TEXT NOT NULL,
    is_checked_in BOOLEAN DEFAULT FALSE,
    check_in_timestamp TIMESTAMPTZ,
    qr_payload TEXT NOT NULL,
    minted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_owner ON m09_wallet.tickets(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_wallet_event ON m09_wallet.tickets(event_id);
