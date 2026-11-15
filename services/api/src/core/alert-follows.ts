// People who asked to be told about an alert (an outage or a danger or works zone), and people who said it affects them too.
// Kept in memory and written to core_alert_follows, so they survive a restart. Each person counts once per alert.
import { db } from './db.ts';

type Kind = 'follow' | 'affects';
const sets: Record<Kind, Map<string, Set<string>>> = { follow: new Map(), affects: new Map() };

const SCHEMA = `CREATE TABLE IF NOT EXISTS core_alert_follows (
  alert_id VARCHAR(128) NOT NULL, user_sub VARCHAR(255) NOT NULL, kind VARCHAR(8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (alert_id, user_sub, kind))`;

let loaded: Promise<void> | null = null;
function load(): Promise<void> {
  loaded ??= (async () => {
    if (!db.isTigerConnected()) return;
    try {
      await db.query(SCHEMA);
      const rows = await db.query<any>(`SELECT alert_id, user_sub, kind FROM core_alert_follows`);
      for (const r of rows) add(r.kind as Kind, r.alert_id, r.user_sub);
    } catch (err: any) {
      console.warn('[alert-follows] could not load:', err.message);
    }
  })();
  return loaded;
}

function add(kind: Kind, alertId: string, sub: string): boolean {
  let who = sets[kind].get(alertId);
  if (!who) sets[kind].set(alertId, (who = new Set()));
  if (who.has(sub)) return false;
  who.add(sub);
  return true;
}

function save(kind: Kind, alertId: string, sub: string, on: boolean) {
  if (!db.isTigerConnected()) return;
  const q = on
    ? db.query(`INSERT INTO core_alert_follows (alert_id, user_sub, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [alertId, sub, kind])
    : db.query(`DELETE FROM core_alert_follows WHERE alert_id = $1 AND user_sub = $2 AND kind = $3`, [alertId, sub, kind]);
  q.catch((err: any) => console.warn('[alert-follows] could not save:', err.message));
}

/** True when this person was not following it already. */
export async function follow(alertId: string, sub: string): Promise<boolean> {
  await load();
  const isNew = add('follow', alertId, sub);
  if (isNew) save('follow', alertId, sub, true);
  return isNew;
}

export async function unfollow(alertId: string, sub: string): Promise<void> {
  await load();
  sets.follow.get(alertId)?.delete(sub);
  save('follow', alertId, sub, false);
}

/** "This affects me too": true when it is the first time this person says so. */
export async function markAffected(alertId: string, sub: string): Promise<boolean> {
  await load();
  const isNew = add('affects', alertId, sub);
  if (isNew) save('affects', alertId, sub, true);
  return isNew;
}

export async function followersOf(alertId: string): Promise<string[]> {
  await load();
  return [...(sets.follow.get(alertId) ?? [])];
}

export async function stateFor(alertId: string, sub: string): Promise<{ following: boolean; affected: boolean }> {
  await load();
  return { following: !!sets.follow.get(alertId)?.has(sub), affected: !!sets.affects.get(alertId)?.has(sub) };
}
