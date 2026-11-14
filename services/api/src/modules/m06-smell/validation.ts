import type { Area } from '@hub/contracts';
import { TIMISOARA_AREAS, calculateDistanceMeters, findMatchingArea, getAreaBySlugOrName } from '../../core/areas.ts';
import { SMELL_TYPES, type NewSmellReport, type SmellType } from './types.ts';
import type { ReadOptions } from './service.ts';

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const NOTE_MAX = 300;
export const HOURS_MAX = 168;
/** A location outside every area still counts for the nearest area if it is this close to its centre. */
const NEAREST_AREA_MAX_M = 5_000;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

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

/** Body of POST /reports. Location: lat+lng, areaId, or both; the missing one is derived. */
export function parseNewReport(body: unknown): Result<NewSmellReport> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Body must be a JSON object' };
  const b = body as Record<string, unknown>;

  if (typeof b.type !== 'string' || !(SMELL_TYPES as readonly string[]).includes(b.type)) {
    return { ok: false, error: `type must be one of: ${SMELL_TYPES.join(', ')}` };
  }
  if (!isNum(b.intensity) || !Number.isInteger(b.intensity) || b.intensity < 1 || b.intensity > 5) {
    return { ok: false, error: 'intensity must be a whole number from 1 to 5' };
  }

  let note: string | null = null;
  if (b.note !== undefined && b.note !== null) {
    if (typeof b.note !== 'string') return { ok: false, error: 'note must be text' };
    const trimmed = b.note.trim();
    if (trimmed.length > NOTE_MAX) return { ok: false, error: `note must be at most ${NOTE_MAX} characters` };
    note = trimmed || null;
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
    const raw = (b.areaId as string).trim();
    area = TIMISOARA_AREAS.find((a) => a.id === raw) ?? getAreaBySlugOrName(raw);
    if (!area) return { ok: false, error: `Unknown areaId "${raw}" (see /v1/core/areas)` };
  } else {
    area = nearestArea(b.lat as number, b.lng as number);
    if (!area) return { ok: false, error: 'This location is outside the Timișoara areas we cover; choose an area instead' };
  }

  return {
    ok: true,
    value: {
      type: b.type as SmellType,
      intensity: b.intensity,
      lat: hasLat ? (b.lat as number) : area.center_lat,
      lng: hasLng ? (b.lng as number) : area.center_lng,
      areaId: area.id,
      note,
    },
  };
}

/** ?hours= (1–168, default per route) and ?includeDemo= (default true; "false" or "0" turns it off). */
export function parseReadQuery(query: { hours?: string; includeDemo?: string }, defaultHours: number): Result<ReadOptions> {
  let hours = defaultHours;
  if (query.hours !== undefined && query.hours !== '') {
    const n = Number(query.hours);
    if (!Number.isInteger(n) || n < 1 || n > HOURS_MAX) return { ok: false, error: `hours must be a whole number from 1 to ${HOURS_MAX}` };
    hours = n;
  }
  const d = query.includeDemo?.toLowerCase();
  if (d !== undefined && d !== '' && !['true', 'false', '1', '0'].includes(d)) {
    return { ok: false, error: 'includeDemo must be true or false' };
  }
  return { ok: true, value: { hours, includeDemo: !(d === 'false' || d === '0') } };
}
