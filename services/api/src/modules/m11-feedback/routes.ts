import { timingSafeEqual } from 'node:crypto';
import { Hono } from 'hono';
import { feedbackService } from './service';
import { parseInAppInput, parseSurveyPayload } from './validation';

export const feedbackRoutes = new Hono();

/**
 * Accepts the token as "Authorization: Bearer <token>" or "X-Ingest-Token: <token>".
 * Fails closed: if FEEDBACK_INGEST_TOKEN is not set, every ingest call is rejected.
 */
function ingestAuthorized(authorization?: string, ingestHeader?: string): boolean {
  const expected = process.env.FEEDBACK_INGEST_TOKEN?.trim();
  const given = (authorization?.startsWith('Bearer ') ? authorization.slice(7) : ingestHeader)?.trim();
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// In-app feedback
feedbackRoutes.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  const parsed = parseInAppInput(body);
  if (parsed.ok === false) return c.json({ error: parsed.error }, 400); // `=== false` narrows even with strict: false
  const feedback = await feedbackService.addInApp(parsed.value);
  return c.json({ feedback }, 201);
});

// Survey responses forwarded by the Google Sheet script
feedbackRoutes.post('/ingest', async (c) => {
  if (!ingestAuthorized(c.req.header('Authorization'), c.req.header('X-Ingest-Token'))) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  const parsed = parseSurveyPayload(body);
  if (parsed.ok === false) return c.json({ error: parsed.error }, 400);
  const { entry, duplicate } = await feedbackService.ingestSurvey(parsed.value);
  return c.json({ feedback: entry, duplicate }, duplicate ? 200 : 201);
});

// Living Labs numbers
feedbackRoutes.get('/summary', async (c) => {
  const summary = await feedbackService.getSummary();
  return c.json({ summary });
});

// Versions and the feedback that caused them
feedbackRoutes.get('/changelog', async (c) => {
  const changelog = await feedbackService.getChangelog();
  return c.json({ changelog });
});
