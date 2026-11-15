import { Hono } from 'hono';
import { buddyService } from './service.ts';
import type { CreateBuddyRequestInput } from './types.ts';

export const buddyRoutes = new Hono();

// List buddy requests
buddyRoutes.get('/', async (c) => {
  const eventId = c.req.query('eventId');
  const me = c.get('user' as never) as any;
  // you are looking for company: your own request is not one for you to answer
  const requests = (await buddyService.listRequests(eventId)).filter((r: any) => !me?.sub || r.userId !== me.sub);
  return c.json({ buddyRequests: requests });
});

// Create buddy request ("Looking for company")
buddyRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateBuddyRequestInput>();
    const me = (c as any).get('user');
    const userName = String(body.userName || me?.name || '').trim();
    if (!body.eventId || !userName) {
      return c.json({ error: 'eventId and userName are required' }, 400);
    }
    if (userName.length > 60 || (body.bio ?? '').length > 300) {
      return c.json({ error: 'too_long', error_description: 'A name can be 60 characters and a bio 300.' }, 400);
    }
    // the request belongs to the signed-in person, not to whoever the body names
    const request = await buddyService.createRequest({ ...body, userName, userId: me?.sub });
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
    const me = c.get('user' as never) as any;
    // whoever opens the chat is always one of its participants
    const ids = [me.sub, ...(body.participantIds || []).filter((x) => x !== me.sub)];
    const names = [me.name, ...(body.participantNames || []).filter((_, i) => (body.participantIds || [])[i] !== me.sub)];
    const chat = await buddyService.getOrCreateChat(body.eventId, body.eventTitle, ids, names);
    return c.json({ chat });
  } catch {
    return c.json({ error: 'Failed to create chat' }, 400);
  }
});

// The signed-in person's chats (must come before /chats/:eventId)
buddyRoutes.get('/chats/mine', async (c) => {
  const me = c.get('user' as never) as any;
  if (!me || me.sub === 'guest|unauthenticated') return c.json({ error: 'login_required' }, 401);
  return c.json({ chats: await buddyService.getChatsFor(me.sub), me: me.sub });
});

// Get chats for an event (only the ones you are in: chats are private)
buddyRoutes.get('/chats/:eventId', async (c) => {
  const eventId = c.req.param('eventId');
  const me = c.get('user' as never) as any;
  const chats = (await buddyService.getChatsForEvent(eventId)).filter((ch) => !!me && ch.participantIds.includes(me.sub));
  return c.json({ chats });
});

// Post a message in a buddy chat
buddyRoutes.post('/chats/:chatId/messages', async (c) => {
  const chatId = c.req.param('chatId');
  try {
    const body = await c.req.json<{ content: string }>();
    if (!body.content || typeof body.content !== 'string' || body.content.length > 1000) {
      return c.json({ error: 'A message needs some text, at most 1000 characters.' }, 400);
    }
    const me = c.get('user' as never) as any;
    const chat = await buddyService.getChat(chatId);
    if (!chat) return c.json({ error: 'Chat not found' }, 404);
    if (!chat.participantIds.includes(me.sub)) {
      return c.json({ error: 'not_a_participant', error_description: 'Only people in this chat can write in it.' }, 403);
    }
    const msg = await buddyService.sendMessage(chatId, me.sub, me.name, body.content);
    if (!msg) {
      return c.json({ error: 'Chat not found' }, 404);
    }
    return c.json({ message: msg }, 201);
  } catch {
    return c.json({ error: 'Invalid request payload' }, 400);
  }
});
