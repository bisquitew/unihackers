import { Hono } from 'hono';
import { eventsService } from './service.ts';
import type { CreateEventInput, RSVPInput } from './types.ts';

export const eventsRoutes = new Hono();

// List events with filters
eventsRoutes.get('/', async (c) => {
  const category = c.req.query('category');
  const neighbourhood = c.req.query('neighbourhood');
  const ageGroup = c.req.query('ageGroup');
  const search = c.req.query('search');

  const events = await eventsService.listEvents({
    category,
    neighbourhood,
    ageGroup,
    search,
  });
  return c.json({ events });
});

// Get single event
eventsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const event = await eventsService.getEventById(id);
  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }
  return c.json({ event });
});

// Create new event
eventsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateEventInput>();
    if (!body.title || !body.locationName || !body.dateTime || !body.category) {
      return c.json({ error: 'Missing required event fields' }, 400);
    }
    const event = await eventsService.createEvent(body);
    return c.json({ event }, 201);
  } catch {
    return c.json({ error: 'Invalid request payload' }, 400);
  }
});

// RSVP to an event
eventsRoutes.post('/:id/rsvp', async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json<Omit<RSVPInput, 'eventId'>>();
    const me = c.get('user' as never) as any;
    const userName = me?.name || body.userName;
    if (!userName) {
      return c.json({ error: 'userName is required' }, 400);
    }
    const rsvpRecord = await eventsService.rsvp({
      eventId: id,
      userId: me?.sub || `usr-${Date.now()}`,
      userName,
      userWallet: body.userWallet,
      lookingForBuddy: body.lookingForBuddy,
    });
    return c.json({ rsvp: rsvpRecord }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'RSVP failed' }, 400);
  }
});

// Cancel your own place at an event
eventsRoutes.delete('/:id/rsvp', async (c) => {
  const me = c.get('user' as never) as any;
  if (!me?.sub || me.sub === 'guest|unauthenticated') return c.json({ error: 'login_required', error_description: 'Sign in to cancel your place.' }, 401);
  const removed = await eventsService.cancelRsvp(c.req.param('id'), me.sub);
  return c.json({ cancelled: removed });
});

// List RSVPs for an event
eventsRoutes.get('/:id/rsvps', async (c) => {
  const id = c.req.param('id');
  const rsvps = await eventsService.getEventRSVPs(id);
  return c.json({ rsvps });
});
