import { Hono } from 'hono';
import { utilitiesService } from './service.ts';
import { OutageCreatePayloadSchema } from '@hub/contracts';

export const utilitiesRouter = new Hono();

// List all outages
utilitiesRouter.get('/outages', (c) => {
  const provider = c.req.query('provider');
  const status = c.req.query('status');
  const area = c.req.query('area');
  const outages = utilitiesService.getAllOutages({ provider, status, area });
  return c.json(outages);
});

// Single outage
utilitiesRouter.get('/outages/:id', (c) => {
  const id = c.req.param('id');
  const outage = utilitiesService.getOutageById(id);
  if (!outage) {
    return c.json({ error: 'Outage not found' }, 404);
  }
  return c.json(outage);
});

// Create new outage (from admin or ingestion worker)
utilitiesRouter.post('/outages', async (c) => {
  const body = await c.req.json();
  const parseResult = OutageCreatePayloadSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: 'Invalid outage payload', details: parseResult.error.format() }, 400);
  }

  const created = await utilitiesService.createOutage(parseResult.data);
  return c.json(created, 201);
});

// Check if resident's address / area is affected
utilitiesRouter.post('/check-address', async (c) => {
  const body = await c.req.json();
  const query = body.address || body.area || '';
  if (!query) {
    return c.json({ error: 'Must provide address or area in request body' }, 400);
  }

  const impact = utilitiesService.checkAddressImpact(query);
  return c.json(impact);
});

// Crowd confirm ("My building is affected too")
utilitiesRouter.post('/confirm/:id', (c) => {
  const id = c.req.param('id');
  const updated = utilitiesService.confirmOutage(id);
  if (!updated) {
    return c.json({ error: 'Outage not found' }, 404);
  }
  return c.json({
    message: 'Confirmed outage impact',
    confirmations_count: updated.crowd_confirmations_count
  });
});
