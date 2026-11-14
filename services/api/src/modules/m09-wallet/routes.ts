import { Hono } from 'hono';
import { walletService } from './service.ts';
import type { MintTicketPayload, CheckInPayload } from './types.ts';

export const walletRoutes = new Hono();

// Mint a Solana devnet ticket
walletRoutes.post('/mint', async (c) => {
  try {
    const body = await c.req.json<MintTicketPayload>();
    if (!body.eventId || !body.attendeeName) {
      return c.json({ error: 'eventId and attendeeName are required' }, 400);
    }
    const ticket = await walletService.mintTicket(body);
    return c.json({ ticket }, 201);
  } catch {
    return c.json({ error: 'Failed to mint Solana ticket' }, 500);
  }
});

// Get ticket details
walletRoutes.get('/:ticketId', async (c) => {
  const ticketId = c.req.param('ticketId');
  const ticket = await walletService.getTicket(ticketId);
  if (!ticket) {
    return c.json({ error: 'Ticket not found' }, 404);
  }
  return c.json({ ticket });
});

// Verify and Check In ticket via QR code scan
walletRoutes.post('/check-in', async (c) => {
  try {
    const body = await c.req.json<CheckInPayload>();
    if (!body.ticketId) {
      return c.json({ error: 'ticketId is required' }, 400);
    }
    const result = await walletService.checkInTicket(body);
    if (!result.success) {
      return c.json({ error: result.message }, 400);
    }
    return c.json(result);
  } catch {
    return c.json({ error: 'Check-in validation failed' }, 500);
  }
});

// List tickets by user wallet
walletRoutes.get('/user/:wallet', async (c) => {
  const wallet = c.req.param('wallet');
  const tickets = await walletService.listUserTickets(wallet);
  return c.json({ tickets });
});
