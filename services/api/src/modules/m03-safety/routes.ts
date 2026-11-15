import { Hono } from 'hono';
import { rateLimit } from '../../core/rate-limit.ts';
import { safetyService } from './service.ts';
import { SummaryUnavailableError, summarizeArea } from './summary.ts';
import { EMERGENCY_NUMBER, nearestSafePlaces, safePlaces, type SafePlaceKind } from '../../core/safe-places.ts';
import { parseLang, parseNewReport, parseReadQuery, parseType, resolveArea } from './validation.ts';

export const safetyRoutes = new Hono();

const DEFAULT_HOURS = 168; // one week: safety reports are rarer than smell reports

const readQuery = (c: { req: { query: (k: string) => string | undefined } }) =>
  parseReadQuery({ hours: c.req.query('hours'), includeDemo: c.req.query('includeDemo') }, DEFAULT_HOURS);

// Which storage is active (postgres or memory) and why.
safetyRoutes.get('/health', (c) => c.json({ module: 'm03-safety', status: 'ok', storage: safetyService.status(), gemini: Boolean(process.env.GEMINI_API_KEY?.trim()) }));

// 5 reports per client per 10 minutes.
const reportLimit = rateLimit({ windowMs: 10 * 60_000, max: 5, message: 'You sent several reports in a short time. Please wait a few minutes before sending another.' });

safetyRoutes.post('/reports', reportLimit, async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  const parsed = parseNewReport(body);
  if (parsed.ok === false) return c.json({ error: parsed.error }, 400);
  const report = await safetyService.create(parsed.value.report);
  return c.json({ report, noteRedacted: parsed.value.noteRedacted, storage: safetyService.status().active }, 201);
});

// Recent reports (with notes), filterable by area and type.
safetyRoutes.get('/reports', async (c) => {
  const q = readQuery(c);
  if (q.ok === false) return c.json({ error: q.error }, 400);
  const type = parseType(c.req.query('type'));
  if (type.ok === false) return c.json({ error: type.error }, 400);
  let areaId: string | undefined;
  const areaRaw = c.req.query('area');
  if (areaRaw) {
    const area = resolveArea(areaRaw);
    if (!area) return c.json({ error: `Unknown area "${areaRaw}" (see /v1/core/areas)` }, 400);
    areaId = area.id;
  }
  const limitRaw = c.req.query('limit');
  const limit = limitRaw === undefined || limitRaw === '' ? 50 : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) return c.json({ error: 'limit must be a whole number from 1 to 200' }, 400);
  const result = await safetyService.list({ ...q.value, areaId, type: type.value, limit });
  return c.json({ hours: q.value.hours, includeDemo: q.value.includeDemo, area: areaId ?? null, type: type.value ?? null, ...result });
});

// What the shared map shows.
safetyRoutes.get('/pins', async (c) => {
  const q = readQuery(c);
  if (q.ok === false) return c.json({ error: q.error }, 400);
  const { pins, demoCount } = await safetyService.pins(q.value);
  return c.json({ hours: q.value.hours, includeDemo: q.value.includeDemo, demoCount, count: pins.length, pins });
});

safetyRoutes.get('/areas', async (c) => {
  const q = readQuery(c);
  if (q.ok === false) return c.json({ error: q.error }, 400);
  const result = await safetyService.areas(q.value);
  return c.json({ hours: q.value.hours, includeDemo: q.value.includeDemo, ...result });
});

// Safe places: hospitals, police stations and fire stations. Public. ?lat=&lng= sorts by distance; ?kind=hospital|police|fire filters.
safetyRoutes.get('/places', (c) => {
  const kindRaw = c.req.query('kind');
  if (kindRaw && !['hospital', 'police', 'fire'].includes(kindRaw)) return c.json({ error: 'kind must be hospital, police or fire' }, 400);
  const kind = kindRaw as SafePlaceKind | undefined;
  const latRaw = c.req.query('lat');
  const lngRaw = c.req.query('lng');
  if ((latRaw === undefined) !== (lngRaw === undefined)) return c.json({ error: 'Send both lat and lng, or neither' }, 400);
  if (latRaw !== undefined) {
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return c.json({ error: 'lat and lng must be valid coordinates' }, 400);
    const limit = c.req.query('limit') ? Number(c.req.query('limit')) : 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) return c.json({ error: 'limit must be a whole number from 1 to 50' }, 400);
    const places = nearestSafePlaces(lat, lng, { kind, limit });
    return c.json({ emergencyNumber: EMERGENCY_NUMBER, count: places.length, places });
  }
  const places = safePlaces.filter((p) => !kind || p.kind === kind);
  return c.json({ emergencyNumber: EMERGENCY_NUMBER, count: places.length, places });
});

// Gemini summary for one area (?area=gara-de-nord&lang=en); plain counts when there is no key.
safetyRoutes.get('/summary', async (c) => {
  const q = readQuery(c);
  if (q.ok === false) return c.json({ error: q.error }, 400);
  const lang = parseLang(c.req.query('lang'));
  if (lang.ok === false) return c.json({ error: lang.error }, 400);
  const areaRaw = c.req.query('area');
  if (!areaRaw) return c.json({ error: 'area is required, e.g. ?area=gara-de-nord (see /v1/core/areas)' }, 400);
  const area = resolveArea(areaRaw);
  if (!area) return c.json({ error: `Unknown area "${areaRaw}" (see /v1/core/areas)` }, 400);
  try {
    const summary = await summarizeArea(area.id, lang.value, q.value);
    return c.json({ hours: q.value.hours, includeDemo: q.value.includeDemo, summary });
  } catch (err) {
    if (err instanceof SummaryUnavailableError) return c.json({ error: err.message }, 503);
    throw err;
  }
});
