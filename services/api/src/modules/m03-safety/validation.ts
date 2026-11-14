import type { Area } from '@hub/contracts';
import { TIMISOARA_AREAS, calculateDistanceMeters, findMatchingArea, getAreaBySlugOrName } from '../../core/areas.ts';
import { SAFETY_TYPES, type NewSafetyReport, type SafetyType, type SummaryLang } from './types.ts';

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Notes describe a place, so they stay short. */
export const NOTE_MAX = 200;
export const HOURS_MAX = 720; // 30 days
const NEAREST_AREA_MAX_M = 5_000;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// Contact details and identifiers are removed from notes: reports are about places, never about people.
const REDACTIONS: [RegExp, string | ((m: string) => string)][] = [
  [/https?:\/\/\S+|www\.\S+/gi, '[link removed]'],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[contact removed]'],
  [/(^|\s)@\w{2,}/g, '$1[contact removed]'],
  // Phone numbers: 9 or more digits (so dates such as 2026-11-14 stay).
  [/\+?\d[\d\s().-]{7,}\d/g, (m) => (m.replace(/\D/g, '').length >= 9 ? '[number removed]' : m)],
  // Romanian licence plates, e.g. "TM 12 ABC", "B-123-XYZ"
  [/\b[A-Z]{1,2}[\s-]?\d{2,3}[\s-]?[A-Z]{3}\b/g, '[plate removed]'],
];

/** Trim, remove contact details and identifiers, collapse whitespace, limit to NOTE_MAX. Empty → null. */
export function sanitizeNote(raw: string): { note: string | null; redacted: boolean } {
  let note = raw.replace(/[\u0000-\u001f\u007f]/g, ' ');
  let redacted = false;
  for (const [pattern, replacement] of REDACTIONS) {
    const next = typeof replacement === 'string' ? note.replace(pattern, replacement) : note.replace(pattern, replacement);
    if (next !== note) redacted = true;
    note = next;
  }
  note = note.replace(/\s+/g, ' ').trim();
  if (note.length > NOTE_MAX) note = note.slice(0, NOTE_MAX).trimEnd();
  return { note: note || null, redacted };
}

function nearestArea(lat: number, lng: number): Area | undefined {
  const inside = findMatchingArea(lat, lng);
  if (inside) return inside;
  let best: Area | undefined;
  let bestDist = Infinity;
  for (const a of TIMISOARA_AREAS) {
    const d = calculateDistanceMeters(lat, lng, a.center_lat, a.center_lng);
    if (d < bestDist) { best = a; bestDist = d; }
  }
  return bestDist <= NEAREST_AREA_MAX_M ? best : undefined;
}

export function resolveArea(raw: string): Area | undefined {
  const v = raw.trim();
  return TIMISOARA_AREAS.find((a) => a.id === v) ?? getAreaBySlugOrName(v);
}

/** Body of POST /reports. Location: lat+lng, areaId, or both; the missing one is derived. */
export function parseNewReport(body: unknown): Result<{ report: NewSafetyReport; noteRedacted: boolean }> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Body must be a JSON object' };
  const b = body as Record<string, unknown>;

  if (typeof b.type !== 'string' || !(SAFETY_TYPES as readonly string[]).includes(b.type)) {
    return { ok: false, error: `type must be one of: ${SAFETY_TYPES.join(', ')}` };
  }

  let note: string | null = null;
  let noteRedacted = false;
  if (b.note !== undefined && b.note !== null) {
    if (typeof b.note !== 'string') return { ok: false, error: 'note must be text' };
    // Refuse clearly oversized input instead of silently cutting a long text.
    if (b.note.length > NOTE_MAX * 2) return { ok: false, error: `note must be at most ${NOTE_MAX} characters` };
    const clean = sanitizeNote(b.note);
    note = clean.note;
    noteRedacted = clean.redacted;
  }

  const hasLat = b.lat !== undefined && b.lat !== null;
  const hasLng = b.lng !== undefined && b.lng !== null;
  if (hasLat !== hasLng) return { ok: false, error: 'Send both lat and lng, or neither' };
  if (hasLat && (!isNum(b.lat) || !isNum(b.lng) || b.lat < -90 || b.lat > 90 || b.lng < -180 || b.lng > 180)) {
    return { ok: false, error: 'lat and lng must be valid coordinates' };
  }
  const hasArea = typeof b.areaId === 'string' && b.areaId.trim() !== '';
  if (b.areaId !== undefined && b.areaId !== null && !hasArea) return { ok: false, error: 'areaId must be a non-empty string' };
  if (!hasLat && !hasArea) return { ok: false, error: 'Give a location: lat and lng, or areaId (see /v1/core/areas)' };

  let area: Area | undefined;
  if (hasArea) {
    area = resolveArea(b.areaId as string);
    if (!area) return { ok: false, error: `Unknown areaId "${String(b.areaId).trim()}" (see /v1/core/areas)` };
  } else {
    area = nearestArea(b.lat as number, b.lng as number);
    if (!area) return { ok: false, error: 'This location is outside the Timișoara areas we cover; choose an area instead' };
  }

  return {
    ok: true,
    value: {
      report: {
        type: b.type as SafetyType,
        lat: hasLat ? (b.lat as number) : area.center_lat,
        lng: hasLng ? (b.lng as number) : area.center_lng,
        areaId: area.id,
        note,
      },
      noteRedacted,
    },
  };
}

export interface ReadQuery {
  hours: number;
  includeDemo: boolean;
}

/** ?hours= (1–720, default per route) and ?includeDemo= (default true; "false" or "0" turns it off). */
export function parseReadQuery(query: { hours?: string; includeDemo?: string }, defaultHours: number): Result<ReadQuery> {
  let hours = defaultHours;
  if (query.hours !== undefined && query.hours !== '') {
    const n = Number(query.hours);
    if (!Number.isInteger(n) || n < 1 || n > HOURS_MAX) return { ok: false, error: `hours must be a whole number from 1 to ${HOURS_MAX}` };
    hours = n;
  }
  const d = query.includeDemo?.toLowerCase();
  if (d !== undefined && d !== '' && !['true', 'false', '1', '0'].includes(d)) return { ok: false, error: 'includeDemo must be true or false' };
  return { ok: true, value: { hours, includeDemo: !(d === 'false' || d === '0') } };
}

export function parseType(raw: string | undefined): Result<SafetyType | undefined> {
  if (raw === undefined || raw === '') return { ok: true, value: undefined };
  return (SAFETY_TYPES as readonly string[]).includes(raw)
    ? { ok: true, value: raw as SafetyType }
    : { ok: false, error: `type must be one of: ${SAFETY_TYPES.join(', ')}` };
}

export function parseLang(raw: string | undefined): Result<SummaryLang> {
  if (raw === undefined || raw === '') return { ok: true, value: 'ro' };
  const l = raw.toLowerCase();
  return l === 'ro' || l === 'en' ? { ok: true, value: l } : { ok: false, error: 'lang must be ro or en' };
}
