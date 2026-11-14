import { Hono } from 'hono';
import { buddyService } from './service.ts';
import type { CreateBuddyRequestInput } from './types.ts';

export const buddyRoutes = new Hono();

// List buddy requests
buddyRoutes.get('/', async (c) => {
  const eventId = c.req.query('eventId');
  const requests = await buddyService.listRequests(eventId);
  return c.json({ buddyRequests: requests });
});

// Create buddy request ("Looking for company")
buddyRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateBuddyRequestInput>();
    if (!body.eventId || !body.userName) {
      return c.json({ error: 'eventId and userName are required' }, 400);
    }
    const request = await buddyService.createRequest(body);
    return c.json({ buddyRequest: request }, 201);
  } catch {
    return c.json({ error: 'Invalid request payload' }, 400);
  }
});

// Match by interests
buddyRoutes.post('/match', async (c) => {
  try {
    const body = await c.req.json<{ eventId: string; interests: string[] }>();
    if (!body.eventId) {
      return c.json({ error: 'eventId is required' }, 400);
    }
    const matches = await buddyService.findMatches(body.eventId, body.interests || []);
    return c.json({ matches });
  } catch {
    return c.json({ error: 'Invalid request payload' }, 400);
  }
});

// Create or get group chat
buddyRoutes.post('/chats', async (c) => {
  try {
    const body = await c.req.json<{
      eventId: string;
      eventTitle: string;
      participantIds: string[];
      participantNames: string[];
    }>();
    const chat = await buddyService.getOrCreateChat(
      body.eventId,
      body.eventTitle,
      body.participantIds || [],
      body.participantNames || []
    );
    return c.json({ chat });
  } catch {
    return c.json({ error: 'Failed to create chat' }, 400);
  }
});

// Get chats for an event
buddyRoutes.get('/chats/:eventId', async (c) => {
  const eventId = c.req.param('eventId');
  const chats = await buddyService.getChatsForEvent(eventId);
  return c.json({ chats });
});

// Post a message in a buddy chat
buddyRoutes.post('/chats/:chatId/messages', async (c) => {
  const chatId = c.req.param('chatId');
  try {
    const body = await c.req.json<{ senderId: string; senderName: string; content: string }>();
    if (!body.content || !body.senderName) {
      return c.json({ error: 'senderName and content are required' }, 400);
    }
    const msg = await buddyService.sendMessage(
      chatId,
      body.senderId || 'usr-anon',
      body.senderName,
      body.content
    );
    if (!msg) {
      return c.json({ error: 'Chat not found' }, 404);
    }
    return c.json({ message: msg }, 201);
  } catch {
    return c.json({ error: 'Invalid request payload' }, 400);
  }
});
