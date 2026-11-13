import { Hono } from 'hono';
import { transitService } from './service.ts';
import { DetourAlertSchema } from '@hub/contracts';

export const transitRouter = new Hono();

// List all transit lines with their detour status
transitRouter.get('/lines', (c) => {
  return c.json(transitService.getAllLines());
});

// List all active detours and alerts
transitRouter.get('/detours', (c) => {
  return c.json(transitService.getAllDetours());
});

// Check if a specific stop is affected by roadwork detours
transitRouter.post('/check-stop', async (c) => {
  const body = await c.req.json();
  const stopName = body.stop_name || body.stop || '';
  if (!stopName) {
    return c.json({ error: 'Must provide stop_name in request body' }, 400);
  }

  const result = transitService.checkStopImpact(stopName);
  return c.json(result);
});

// Admin / Scraper adds a new detour announcement
transitRouter.post('/detours', async (c) => {
  const body = await c.req.json();
  const parseResult = DetourAlertSchema.safeParse({
    ...body,
    id: body.id || crypto.randomUUID(),
    created_at: body.created_at || new Date().toISOString()
  });

  if (!parseResult.success) {
    return c.json({ error: 'Invalid detour alert format', details: parseResult.error.format() }, 400);
  }

  const created = await transitService.addDetourAlert(parseResult.data);
  return c.json(created, 201);
});
