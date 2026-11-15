// What each signed-in person holds: the Solana tickets they were given and the badges they earned. Kept in memory for
// fast reads and written to m09_wallet_items, so the website and the app show the same wallet, also after a restart.
import { db } from './db.ts';

type Wallet = { tickets: any[]; poaps: any[] };
const wallets = new Map<string, Wallet>();

const SCHEMA = `CREATE TABLE IF NOT EXISTS m09_wallet_items (
  item_id VARCHAR(128) PRIMARY KEY,
  user_sub VARCHAR(255) NOT NULL,
  kind VARCHAR(16) NOT NULL CHECK (kind IN ('ticket', 'badge')),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

export function walletOf(sub: string): Wallet {
  let w = wallets.get(sub);
  if (!w) wallets.set(sub, (w = { tickets: [], poaps: [] }));
  return w;
}

async function save(sub: string, kind: 'ticket' | 'badge', id: string, data: any) {
  if (!db.isTigerConnected()) return;
  try {
    await db.query(
      `INSERT INTO m09_wallet_items (item_id, user_sub, kind, data) VALUES ($1, $2, $3, $4)
       ON CONFLICT (item_id) DO UPDATE SET data = EXCLUDED.data`,
      [id, sub, kind, JSON.stringify(data)],
    );
  } catch (err: any) {
    console.warn('[wallet] could not save:', err.message);
  }
}

export function addTicket(sub: string, ticket: any) {
  walletOf(sub).tickets.unshift(ticket);
  void save(sub, 'ticket', ticket.ticketId, ticket);
}

export function addBadge(sub: string, badge: any, ticketId?: string) {
  const w = walletOf(sub);
  w.poaps.unshift(badge);
  void save(sub, 'badge', badge.poapId, badge);
  const t = ticketId ? w.tickets.find((x) => x.ticketId === ticketId) : null;
  if (t) {
    t.isCheckedIn = true;
    void save(sub, 'ticket', t.ticketId, t);
  }
}

/** Takes a ticket out of a wallet (cancelling a place). Returns false when it is not there or was already used at the door. */
export function removeTicket(sub: string, ticketId: string): boolean {
  const w = walletOf(sub);
  const t = w.tickets.find((x) => x.ticketId === ticketId);
  if (!t || t.isCheckedIn) return false;
  w.tickets = w.tickets.filter((x) => x.ticketId !== ticketId);
  if (db.isTigerConnected()) {
    db.query(`DELETE FROM m09_wallet_items WHERE item_id = $1 AND user_sub = $2`, [ticketId, sub]).catch((err: any) => console.warn('[wallet] could not remove:', err.message));
  }
  return true;
}

/** Loads every wallet from the database. Run once at start. */
export async function loadWallets(): Promise<number> {
  if (!db.isTigerConnected()) return 0;
  try {
    await db.query(SCHEMA);
    const rows = await db.query<any>(`SELECT user_sub, kind, data FROM m09_wallet_items ORDER BY created_at DESC`);
    for (const r of rows) {
      const w = walletOf(r.user_sub);
      (r.kind === 'ticket' ? w.tickets : w.poaps).push(r.data);
    }
    return rows.length;
  } catch (err: any) {
    console.warn('[wallet] could not load:', err.message);
    return 0;
  }
}
