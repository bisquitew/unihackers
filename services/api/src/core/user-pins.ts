// A person's own map pins, stored per account in core_user_pins (one row with the whole list). Memory is the
// fallback when there is no database.
import { db } from './db.ts';

const memory = new Map<string, unknown[]>();
let ready: Promise<void> | null = null;
const init = () => (ready ??= db.isTigerConnected()
  ? db.query(`CREATE TABLE IF NOT EXISTS core_user_pins (user_sub VARCHAR(255) PRIMARY KEY, pins JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`).then(() => {})
  : Promise.resolve());

export async function loadUserPins(sub: string): Promise<unknown[]> {
  await init();
  if (db.isTigerConnected()) {
    try {
      const rows = await db.query<any>(`SELECT pins FROM core_user_pins WHERE user_sub = $1`, [sub]);
      if (rows[0]) return rows[0].pins;
    } catch {}
  }
  return memory.get(sub) ?? [];
}

export async function saveUserPins(sub: string, pins: unknown[]): Promise<void> {
  memory.set(sub, pins);
  await init();
  if (!db.isTigerConnected()) return;
  try {
    await db.query(`INSERT INTO core_user_pins (user_sub, pins, updated_at) VALUES ($1, $2, NOW())
                    ON CONFLICT (user_sub) DO UPDATE SET pins = EXCLUDED.pins, updated_at = NOW()`, [sub, JSON.stringify(pins)]);
  } catch (err: any) {
    console.warn('[user-pins] could not save:', err.message);
  }
}
