// Living Labs survey → our API, kept up to date by itself (P4).
// The Google Sheet cannot reach an API on a laptop, so the API pulls instead: at start and every 5 minutes it calls the
// Sheet's read-only web endpoint (doGet in docs/living-labs/feedback-sheet.gs) with the ingest token, gets the cleaned
// answers (never emails) and passes each one to feedbackService.ingestSurvey, which skips answers it already has and
// saves new ones in Tiger Cloud (m11_survey_entries). The staff Analytics page and the summary then read them.
// Env: SURVEY_SYNC_URL (the Sheet web app's /exec URL) + FEEDBACK_INGEST_TOKEN. Neither is ever logged.
import { db } from '../../core/db.ts';
import type { SurveyPayload } from './types.ts';
import { parseSurveyPayload } from './validation.ts';

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

interface Ingestor {
  ingestSurvey(p: SurveyPayload): Promise<{ duplicate: boolean }>;
}

const status: SyncStatus = { configured: false, running: false, lastSyncAt: null, lastResult: null, lastError: null, storedInDatabase: false };
const isConfigured = () => Boolean(process.env.SURVEY_SYNC_URL?.trim() && process.env.FEEDBACK_INGEST_TOKEN?.trim());

/** One pull from the Sheet. */
export async function syncSurveyOnce(service: Ingestor): Promise<SyncStatus> {
  const url = process.env.SURVEY_SYNC_URL?.trim();
  const token = process.env.FEEDBACK_INGEST_TOKEN?.trim();
  status.configured = isConfigured();
  if (!url || !token || status.running) return { ...status };
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
    if (added) console.log(`[m11-feedback] survey sync: ${added} new answer(s)`);
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    status.lastError = timedOut ? 'the Sheet did not answer in time' : err instanceof Error ? err.message.split(token).join('***') : 'sync failed';
    console.warn(`[m11-feedback] survey sync failed: ${status.lastError}`);
  } finally {
    status.running = false;
    status.lastSyncAt = new Date().toISOString();
    status.storedInDatabase = db.isTigerConnected();
  }
  return { ...status };
}

export function surveySyncStatus(): SyncStatus {
  return { ...status, configured: isConfigured(), storedInDatabase: db.isTigerConnected() };
}

let started = false;
/** Pull from the Sheet now and every 5 minutes (only when SURVEY_SYNC_URL is set). Safe to call more than once. */
export function startSurveySync(service: Ingestor): void {
  if (started || !isConfigured()) return;
  started = true;
  void syncSurveyOnce(service);
  setInterval(() => void syncSurveyOnce(service), EVERY_MS).unref?.();
}
