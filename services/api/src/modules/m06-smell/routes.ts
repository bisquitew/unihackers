import { Hono } from 'hono';
import { rateLimit } from '../../core/rate-limit.ts';
import { smellService } from './service.ts';
import { parseNewReport, parseReadQuery } from './validation.ts';

export const smellRoutes = new Hono();

const readQuery = (c: { req: { query: (k: string) => string | undefined } }, defaultHours: number) =>
  parseReadQuery({ hours: c.req.query('hours'), includeDemo: c.req.query('includeDemo') }, defaultHours);

// Which storage is active (postgres or memory) and why.
smellRoutes.get('/health', async (c) => {
  const wind = await smellService.windNow();
  return c.json({ module: 'm06-smell', status: 'ok', storage: smellService.status(), wind: { source: wind.source, cached: wind.cached, reason: wind.reason } });
});

// 10 reports per client per 10 minutes (smells change fast, so more than safety's 5).
const reportLimit = rateLimit({ windowMs: 10 * 60_000, max: 10, message: 'You sent many reports in a short time. Please wait a few minutes before sending another.' });

smellRoutes.post('/reports', reportLimit, async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  const parsed = parseNewReport(body);
  if (parsed.ok === false) return c.json({ error: parsed.error }, 400);
  const report = await smellService.create(parsed.value);
  return c.json({ report, storage: smellService.status().active }, 201);
});

// What the shared map shows.
smellRoutes.get('/pins', async (c) => {
  const q = readQuery(c, 24);
  if (q.ok === false) return c.json({ error: q.error }, 400);
  const { pins, demoCount } = await smellService.pins(q.value);
  return c.json({ hours: q.value.hours, includeDemo: q.value.includeDemo, demoCount, count: pins.length, pins });
});

smellRoutes.get('/areas', async (c) => {
  const q = readQuery(c, 24);
  if (q.ok === false) return c.json({ error: q.error }, 400);
  const result = await smellService.areas(q.value);
  return c.json({ hours: q.value.hours, includeDemo: q.value.includeDemo, ...result });
});

smellRoutes.get('/timeseries', async (c) => {
  const q = readQuery(c, 48);
  if (q.ok === false) return c.json({ error: q.error }, 400);
  const result = await smellService.timeseries(q.value);
  return c.json({ hours: q.value.hours, includeDemo: q.value.includeDemo, ...result });
});

smellRoutes.get('/wind', async (c) => {
  const wind = await smellService.windNow();
  return c.json({ wind });
});

smellRoutes.get('/source-hint', async (c) => {
  const q = readQuery(c, 6);
  if (q.ok === false) return c.json({ error: q.error }, 400);
  const result = await smellService.sourceHint(q.value);
  return c.json({ hours: q.value.hours, includeDemo: q.value.includeDemo, ...result });
});
