// Photo of a utility notice → draft outage (Gemini image input + structured JSON output).
// Reuses P2's outage format (@hub/contracts) and, on confirm, m04's own createOutage().
// The photo is only sent to Gemini; it is never stored or logged.
import { GoogleGenAI } from '@google/genai';
import type { OutageCreatePayload, OutageSeverity, OutageStatus, OutageType, UtilityProvider } from '@hub/contracts';
import { getAreaBySlugOrName } from '../../core/areas.ts';

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
export const NOTICE_MAX_BYTES = 6 * 1024 * 1024;
export const NOTICE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export const PROVIDERS: UtilityProvider[] = ['colterm', 'aquatim', 'retele_electrice_banat', 'delgaz_grid'];
export const OUTAGE_TYPES: OutageType[] = ['heating_and_hot_water', 'hot_water_only', 'cold_water', 'electricity', 'gas'];
const STATUSES: OutageStatus[] = ['scheduled_maintenance', 'unplanned_breakdown'];
const SEVERITIES: OutageSeverity[] = ['low', 'medium', 'high', 'critical'];

/** Gemini missing or failing; routes answer 503 like the assistant. */
export class NoticeUnavailableError extends Error {}

export interface NoticeDraft {
  provider: UtilityProvider | null;
  type: OutageType | null;
  status: OutageStatus;
  severity: OutageSeverity;
  title: string;
  description: string;
  /** Official area names from core/areas where they could be matched. */
  affected_areas: string[];
  affected_streets: string[];
  start_time: string | null;
  estimated_restore_time: string | null;
}

export interface NoticeParseResult {
  isNotice: boolean;
  /** Why the image was not read as a notice, when isNotice is false. */
  reason: string | null;
  draft: NoticeDraft | null;
  /** Things the reviewer should check before publishing. */
  warnings: string[];
}

// Structured output schema (Gemini responseSchema, OpenAPI subset).
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    is_utility_notice: { type: 'BOOLEAN', description: 'True only if the image is a notice about a water, heating, hot water, electricity or gas interruption.' },
    reason_if_not: { type: 'STRING', nullable: true },
    provider: { type: 'STRING', enum: [...PROVIDERS, 'unknown'], description: 'colterm = heating/hot water, aquatim = water, retele_electrice_banat = electricity, delgaz_grid = gas.' },
    type: { type: 'STRING', enum: [...OUTAGE_TYPES, 'unknown'] },
    planned: { type: 'BOOLEAN', description: 'True for scheduled works announced in advance, false for an emergency breakdown.' },
    severity: { type: 'STRING', enum: SEVERITIES },
    title_ro: { type: 'STRING', description: 'Short Romanian title, e.g. "Oprire apă rece — Calea Aradului".' },
    description_ro: { type: 'STRING', description: 'One or two Romanian sentences: what stops, where, why, until when. Only facts from the notice.' },
    neighbourhoods: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Neighbourhoods named or clearly implied by the streets (e.g. "Iosefin", "Complex Studențesc").' },
    streets: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Streets / addresses exactly as written, with numbers if given.' },
    start_local: { type: 'STRING', nullable: true, description: 'Start as local Timișoara time "YYYY-MM-DDTHH:mm", or null if not in the notice.' },
    end_local: { type: 'STRING', nullable: true, description: 'Estimated end as local time "YYYY-MM-DDTHH:mm", or null.' },
    unreadable_parts: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Anything that was hard to read or ambiguous.' },
  },
  required: ['is_utility_notice', 'provider', 'type', 'planned', 'severity', 'title_ro', 'description_ro', 'neighbourhoods', 'streets', 'start_local', 'end_local', 'unreadable_parts'],
};

const SYSTEM = `You read photos of public notices about utility interruptions in Timișoara, Romania (Aquatim water, Colterm heating/hot water, Rețele Electrice Banat electricity, Delgaz gas).
Extract only what is written on the notice. Never guess streets, dates or providers that are not visible; use null, "unknown" or list them in unreadable_parts instead.
If the image is not such a notice, set is_utility_notice to false and explain briefly in reason_if_not.`;

let client: GoogleGenAI | null = null;
let clientKey = '';

function safeMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const key = process.env.GEMINI_API_KEY?.trim();
  return (key ? raw.split(key).join('[redacted]') : raw).slice(0, 200);
}

/** Bucharest offset (+02:00 / +03:00) for a local date-time. */
function bucharestOffset(localIso: string): string {
  const guess = new Date(`${localIso}:00Z`);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', timeZoneName: 'longOffset' }).formatToParts(guess);
  const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+02:00';
  return name.replace('GMT', '') || '+00:00';
}

/** "2026-11-15T09:00" (Timișoara time) → ISO with offset, or null if not a valid date-time. */
export function localToIso(local: string | null | undefined): string | null {
  if (!local || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local.trim())) return null;
  const iso = `${local.trim()}:00${bucharestOffset(local.trim())}`;
  return Number.isNaN(Date.parse(iso)) ? null : new Date(iso).toISOString();
}

export async function parseNoticePhoto(image: Uint8Array, mimeType: string, now = new Date()): Promise<NoticeParseResult> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new NoticeUnavailableError('Reading notices needs the AI service, which is not configured on this server.');
  if (!client || key !== clientKey) {
    client = new GoogleGenAI({ apiKey: key });
    clientKey = key;
  }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest', dateStyle: 'short' }).format(now);

  let raw: string;
  try {
    const response = await client.models.generateContent({
      model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: Buffer.from(image).toString('base64') } },
            { text: `Today in Timișoara is ${today}. If the notice gives a day without a year, use the year that makes the date upcoming or today. Extract the interruption.` },
          ],
        },
      ],
      config: { systemInstruction: SYSTEM, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA as never, temperature: 0 },
    });
    raw = (response.text ?? '').trim();
  } catch (err) {
    const status = (err as { status?: number }).status;
    console.error(`[m10-notice] Gemini failed${status ? ` (HTTP ${status})` : ''}: ${safeMessage(err)}`);
    if (status === 429) throw new NoticeUnavailableError('The AI service is getting too many requests right now. Please wait a few seconds and try again.');
    throw new NoticeUnavailableError('The AI service could not read the photo right now. Please try again in a moment.');
  }

  let g: Record<string, unknown>;
  try {
    g = JSON.parse(raw);
  } catch {
    throw new NoticeUnavailableError('The AI service returned an unreadable answer. Please try again.');
  }

  if (g.is_utility_notice !== true) {
    return { isNotice: false, reason: typeof g.reason_if_not === 'string' && g.reason_if_not ? g.reason_if_not : 'This does not look like a utility interruption notice.', draft: null, warnings: [] };
  }

  const warnings: string[] = [];
  const provider = PROVIDERS.includes(g.provider as UtilityProvider) ? (g.provider as UtilityProvider) : null;
  const type = OUTAGE_TYPES.includes(g.type as OutageType) ? (g.type as OutageType) : null;
  if (!provider) warnings.push('Furnizorul nu a putut fi citit — alege-l.');
  if (!type) warnings.push('Tipul întreruperii nu a putut fi citit — alege-l.');

  // Map neighbourhood names to the official area names used by m04 and the rest of the app.
  const areas: string[] = [];
  for (const n of Array.isArray(g.neighbourhoods) ? (g.neighbourhoods as unknown[]) : []) {
    if (typeof n !== 'string' || !n.trim()) continue;
    const area = getAreaBySlugOrName(n);
    const name = area ? area.name : n.trim();
    if (!area) warnings.push(`Zona „${n.trim()}” nu e în lista de cartiere a aplicației — verifică.`);
    if (!areas.includes(name)) areas.push(name);
  }
  if (areas.length === 0) warnings.push('Nu am găsit cartierele afectate — adaugă cel puțin unul.');

  const start = localToIso(typeof g.start_local === 'string' ? g.start_local : null);
  const end = localToIso(typeof g.end_local === 'string' ? g.end_local : null);
  if (!start) warnings.push('Ora de început lipsește sau nu e clară.');
  if (!end) warnings.push('Ora estimată de reluare lipsește sau nu e clară.');
  for (const u of Array.isArray(g.unreadable_parts) ? (g.unreadable_parts as unknown[]) : []) if (typeof u === 'string' && u.trim()) warnings.push(`Greu de citit: ${u.trim()}`);

  return {
    isNotice: true,
    reason: null,
    draft: {
      provider,
      type,
      status: g.planned === true ? 'scheduled_maintenance' : 'unplanned_breakdown',
      severity: SEVERITIES.includes(g.severity as OutageSeverity) ? (g.severity as OutageSeverity) : 'medium',
      title: String(g.title_ro ?? '').trim().slice(0, 140),
      description: String(g.description_ro ?? '').trim().slice(0, 600),
      affected_areas: areas,
      affected_streets: (Array.isArray(g.streets) ? (g.streets as unknown[]) : []).filter((s): s is string => typeof s === 'string' && !!s.trim()).map((s) => s.trim()).slice(0, 30),
      start_time: start,
      estimated_restore_time: end,
    },
    warnings,
  };
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** The reviewed draft sent to /notice/confirm, checked again before it reaches m04. */
export function parseConfirmedDraft(body: unknown): Result<OutageCreatePayload> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Body must be a JSON object' };
  const b = body as Record<string, unknown>;
  if (!PROVIDERS.includes(b.provider as UtilityProvider)) return { ok: false, error: `provider must be one of: ${PROVIDERS.join(', ')}` };
  if (!OUTAGE_TYPES.includes(b.type as OutageType)) return { ok: false, error: `type must be one of: ${OUTAGE_TYPES.join(', ')}` };
  if (b.status !== undefined && !STATUSES.includes(b.status as OutageStatus)) return { ok: false, error: `status must be one of: ${STATUSES.join(', ')}` };
  if (b.severity !== undefined && !SEVERITIES.includes(b.severity as OutageSeverity)) return { ok: false, error: `severity must be one of: ${SEVERITIES.join(', ')}` };
  const title = typeof b.title === 'string' ? b.title.trim() : '';
  const description = typeof b.description === 'string' ? b.description.trim() : '';
  if (title.length < 5 || title.length > 140) return { ok: false, error: 'title must be 5–140 characters' };
  if (description.length < 5 || description.length > 600) return { ok: false, error: 'description must be 5–600 characters' };
  const strings = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && !!s.trim()).map((s) => s.trim().slice(0, 120)).slice(0, max) : null);
  const areas = strings(b.affected_areas, 13);
  const streets = strings(b.affected_streets, 30) ?? [];
  if (!areas || areas.length === 0) return { ok: false, error: 'affected_areas must list at least one area' };
  const time = (v: unknown, name: string): Result<string | undefined> => {
    if (v === undefined || v === null || v === '') return { ok: true, value: undefined };
    return typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? { ok: true, value: new Date(v).toISOString() } : { ok: false, error: `${name} must be an ISO date-time` };
  };
  const start = time(b.start_time, 'start_time');
  if (start.ok === false) return start;
  const end = time(b.estimated_restore_time, 'estimated_restore_time');
  if (end.ok === false) return end;
  if (start.value && end.value && Date.parse(end.value) < Date.parse(start.value)) return { ok: false, error: 'estimated_restore_time is before start_time' };
  return {
    ok: true,
    value: {
      provider: b.provider as UtilityProvider,
      type: b.type as OutageType,
      status: (b.status as OutageStatus) ?? 'scheduled_maintenance',
      severity: (b.severity as OutageSeverity) ?? 'medium',
      title,
      description,
      affected_areas: areas,
      affected_streets: streets,
      start_time: start.value,
      estimated_restore_time: end.value ?? null,
    },
  };
}
