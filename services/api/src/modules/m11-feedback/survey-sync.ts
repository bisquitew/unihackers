// Living Labs survey → Tiger Cloud, kept up to date by itself (P4).
// The Google Sheet cannot reach an API on a laptop, so the API pulls instead: every few minutes it calls the Sheet's
// read-only web endpoint (doGet in docs/living-labs/feedback-sheet.gs) with the ingest token, gets the cleaned answers
// (never emails) and ingests the new ones. Every survey answer is stored in m11_survey_responses, and at start the
// answers and the in-app feedback saved in m11_feedback are loaded back, so a restart forgets nothing.
// Env: SURVEY_SYNC_URL (the Sheet web app's /exec URL) + FEEDBACK_INGEST_TOKEN. Neither is ever logged.
import { db } from '../../core/db.ts';
import type { SurveyPayload } from './types.ts';
import { parseSurveyPayload } from './validation.ts';

const TABLE = 'm11_survey_responses';
const EVERY_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 30_000; // Apps Script web apps can take a while to wake up

export interface SyncStatus {
  configured: boolean;
  running: boolean;
  lastSyncAt: string | null;
  lastResult: { received: number; added: number } | null;
  lastError: string | null;
  storedInDatabase: boolean;
}

const status: SyncStatus = { configured: false, running: false, lastSyncAt: null, lastResult: null, lastError: null, storedInDatabase: false };
let tableReady: Promise<boolean> | null = null;

function ensureTable(): Promise<boolean> {
  tableReady ??= (async () => {
    if (!db.isTigerConnected()) {
      // core/db.ts connects asynchronously; one query waits for it
      await db.query('SELECT 1');
      if (!db.isTigerConnected()) return false;
    }
    await db.query(`CREATE TABLE IF NOT EXISTS ${TABLE} (
      external_id VARCHAR(128) PRIMARY KEY,
      payload JSONB NOT NULL,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    return true;
  })().catch(() => false);
  return tableReady;
}

/** Saves one survey answer (no-op without a database; duplicates are ignored). */
export async function storeSurveyAnswer(p: SurveyPayload): Promise<void> {
  if (!(await ensureTable())) return;
  await db.query(`INSERT INTO ${TABLE} (external_id, payload) VALUES ($1, $2) ON CONFLICT (external_id) DO NOTHING`, [p.externalId, JSON.stringify(p)]);
}

interface Ingestor {
  ingestSurvey(p: SurveyPayload): Promise<{ duplicate: boolean }>;
  restoreInApp(row: { id: string; rating: number | null; text: string | null; app_version: string | null; module_id: string | null; created_at: Date | string }): void;
}

/** Loads saved survey answers and in-app feedback back into memory. Run once at start. */
export async function loadSavedFeedback(service: Ingestor): Promise<{ survey: number; inApp: number }> {
  if (!(await ensureTable())) return { survey: 0, inApp: 0 };
  status.storedInDatabase = true;
  const survey = await db.query<{ payload: SurveyPayload }>(`SELECT payload FROM ${TABLE} ORDER BY received_at`);
  for (const r of survey) await service.ingestSurvey(r.payload);
  const inApp = await db.query<any>(`SELECT id, rating, text, app_version, module_id, created_at FROM m11_feedback ORDER BY created_at`).catch(() => []);
  for (const r of inApp) service.restoreInApp(r);
  return { survey: survey.length, inApp: inApp.length };
}

/** One pull from the Sheet. Returns how many answers were new. */
export async function syncSurveyOnce(service: Ingestor): Promise<SyncStatus> {
  const url = process.env.SURVEY_SYNC_URL?.trim();
  const token = process.env.FEEDBACK_INGEST_TOKEN?.trim();
  status.configured = Boolean(url && token);
  if (!url || !token || status.running) return status;
  status.running = true;
  try {
    const u = new URL(url);
    u.searchParams.set('token', token);
    const res = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`the Sheet answered HTTP ${res.status}`);
    const body = (await res.json().catch(() => null)) as { responses?: unknown[]; error?: string } | null;
    if (!body || !Array.isArray(body.responses)) throw new Error(body?.error ? `the Sheet said: ${body.error}` : 'unexpected answer from the Sheet');
    let added = 0;
    for (const raw of body.responses) {
      const parsed = parseSurveyPayload(raw);
      if (parsed.ok === false) continue;
      const { duplicate } = await service.ingestSurvey(parsed.value);
      if (!duplicate) added += 1;
    }
    status.lastResult = { received: body.responses.length, added };
    status.lastError = null;
    if (added) console.log(`[m11-feedback] survey sync: ${added} new answer(s), ${body.responses.length} in the Sheet`);
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    status.lastError = timedOut ? 'the Sheet did not answer in time' : err instanceof Error ? err.message.replace(token, '***') : 'sync failed';
    console.warn(`[m11-feedback] survey sync failed: ${status.lastError}`);
  } finally {
    status.running = false;
    status.lastSyncAt = new Date().toISOString();
  }
  return status;
}

export function surveySyncStatus(): SyncStatus {
  status.configured = Boolean(process.env.SURVEY_SYNC_URL?.trim() && process.env.FEEDBACK_INGEST_TOKEN?.trim());
  return { ...status };
}

let started = false;
/** Load saved feedback, then pull from the Sheet now and every 5 minutes. Safe to call more than once. */
export function startSurveySync(service: Ingestor): void {
  if (started) return;
  started = true;
  void (async () => {
    const loaded = await loadSavedFeedback(service).catch(() => ({ survey: 0, inApp: 0 }));
    if (loaded.survey || loaded.inApp) console.log(`[m11-feedback] loaded ${loaded.survey} survey answer(s) and ${loaded.inApp} in-app feedback from the database`);
    await syncSurveyOnce(service);
    setInterval(() => void syncSurveyOnce(service), EVERY_MS).unref?.();
  })();
}
