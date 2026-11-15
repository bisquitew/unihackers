import './load-env.ts'; // must stay first: loads root .env before other modules read process.env
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authMiddleware } from './core/auth.ts';
import { TIMISOARA_AREAS } from './core/areas.ts';
import { userService } from './core/users.ts';
import { getUserNotifications, markNotificationAsRead } from './core/notifications.ts';
import { getAllFlags } from './core/flags.ts';
import { geocode, searchPlaces } from './core/geocode.ts';
import { planRoute, RouteError, type RouteMode } from './core/route.ts';
import { rateLimit } from './core/rate-limit.ts';
import { registeredModules } from './modules/index.ts';

type AppVariables = {
  user?: any;
};

const app = new Hono<{ Variables: AppVariables }>();

// Middlewares
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Hub-Client']
}));
app.use('*', authMiddleware);

// Writes to the community modules need a signed-in user; moderating the forum needs staff. Reads stay public, and the
// report-style modules (safety, smell, feedback) stay open on purpose so anyone can report something.
const GUEST_SUB = 'guest|unauthenticated';
app.use('/v1/m/*', async (c, next) => {
  const method = c.req.method;
  const path = c.req.path;
  const user = c.get('user');
  const signedIn = !!user && user.sub !== GUEST_SUB;
  // the moderation queue is staff-only for every method, including reading it
  if (/^\/v1\/m\/(forum|m08-forum)\/moderation(\/|$)/.test(path) && !(signedIn && ['admin', 'moderator'].includes(user.role))) {
    return c.json({ error: 'insufficient_role', error_description: 'Moderating needs a staff account.' }, 403);
  }
  // the feedback analytics are for staff
  if (/^\/v1\/m\/(feedback|m11-feedback)\/analytics(\/|$)/.test(path) && !(signedIn && ['admin', 'moderator'].includes(user.role))) {
    return c.json({ error: 'insufficient_role', error_description: 'Analytics are for city staff.' }, 403);
  }
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  if (/^\/v1\/m\/(events|m01-events|buddy|m07-buddy|forum|m08-forum|wallet|m09-wallet)(\/|$)/.test(path) && !signedIn) {
    return c.json({ error: 'login_required', error_description: 'Sign in to do this.' }, 401);
  }
  // confirming an outage counts once per person, so it needs an account
  if (/^\/v1\/m\/(utilities|m04-utilities)\/confirm\//.test(path) && !signedIn) {
    return c.json({ error: 'login_required', error_description: 'Sign in to confirm an outage.' }, 401);
  }
  // publishing outages and detours is for staff, also when this app runs on its own (index.ts on port 3001)
  if (/^\/v1\/m\/(utilities|m04-utilities)\/outages(\/|$)|^\/v1\/m\/(transit|m05-transit)\/detours(\/|$)/.test(path)
      && !(signedIn && user.role === 'admin')) {
    return c.json({ error: 'insufficient_role', error_description: 'Publishing needs a staff account.' }, 403);
  }
  // letting people in at the door is for event hosts and staff
  if (/^\/v1\/m\/(wallet|m09-wallet)\/check-in(\/|$)/.test(path) && !(signedIn && ['admin', 'moderator', 'organizer'].includes(user.role))) {
    return c.json({ error: 'insufficient_role', error_description: 'Checking in tickets is for event hosts.' }, 403);
  }
  return next();
});

// Health check
app.get('/health', (c) => c.json({
  status: 'ok',
  project: 'Timișoara City Hub API',
  version: '1.0.0',
  timestamp: new Date().toISOString()
}));

app.get('/', (c) => c.json({
  project: 'Timișoara City Hub API',
  hackathon: 'UNIHACK 2026',
  status: 'online',
  mountedModules: registeredModules.map((m) => m.id),
}));

// ==========================================
// CORE ROUTES (/v1/core/...)
// ==========================================
const core = new Hono<{ Variables: AppVariables }>();

// Areas in Timișoara
core.get('/areas', (c) => c.json(TIMISOARA_AREAS));

// Feature flags
core.get('/flags', (c) => c.json(getAllFlags()));

// Place name or address -> coordinates (signed-in people only, a few a minute)
const geocodeUse = new Map<string, number[]>();
core.get('/geocode', async (c) => {
  const user = c.get('user');
  if (!user || user.sub === 'guest|unauthenticated') return c.json({ error: 'login_required', error_description: 'Sign in to look up a place.' }, 401);
  const recent = (geocodeUse.get(user.sub) ?? []).filter((t) => Date.now() - t < 60_000);
  if (recent.length >= 15) return c.json({ error: 'rate_limited', error_description: 'Too many lookups. Try again in a minute.' }, 429);
  geocodeUse.set(user.sub, [...recent, Date.now()]);
  const q = c.req.query('q') ?? '';
  return c.json(await geocode(q));
});

// Place and address search for the map's search box. Open to everyone (the website's map is public), a few a second per client.
const placeSearch = rateLimit({ windowMs: 60_000, max: 40, message: 'Too many searches. Try again in a minute.' });
core.get('/places/search', placeSearch, async (c) => {
  const q = c.req.query('q') ?? '';
  if (q.trim().length < 3) return c.json({ places: [] });
  if (q.length > 120) return c.json({ error: 'query_too_long', error_description: 'Search for at most 120 characters.' }, 400);
  return c.json({ places: await searchPlaces(q, 6) });
});

// Directions: a route between two points inside the city, checked against the danger and works zones. Open to everyone (the
// website's map is public); each route asks an outside server, so it is limited per client.
const routeLimit = rateLimit({ windowMs: 60_000, max: 20, message: 'Too many route requests. Try again in a minute.' });
core.get('/route', routeLimit, async (c) => {
  const point = (raw: string | undefined): [number, number] | null => {
    const [lat, lng] = String(raw ?? '').split(',').map(Number);
    // inside the same box the map is confined to (Timișoara and a little around it)
    return Number.isFinite(lat) && Number.isFinite(lng) && lat > 45.6 && lat < 45.9 && lng > 21.0 && lng < 21.5 ? [lng, lat] : null;
  };
  const from = point(c.req.query('from'));
  const to = point(c.req.query('to'));
  if (!from || !to) return c.json({ error: 'bad_points', error_description: 'Give from and to as "lat,lng", both inside Timișoara.' }, 400);
  const modeIn = c.req.query('mode') ?? 'foot';
  if (!['foot', 'bike', 'car'].includes(modeIn)) return c.json({ error: 'bad_mode', error_description: 'mode is foot, bike or car.' }, 400);
  try {
    return c.json(await planRoute(from, to, modeIn as RouteMode, c.req.query('avoid') !== '0'));
  } catch (err: any) {
    if (err instanceof RouteError) return c.json({ error: err.code, error_description: err.message }, err.code === 'no_route' ? 404 : 502);
    throw err;
  }
});

// User profile & saved places
core.get('/user/me', (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Not authenticated' }, 401);
  return c.json(user);
});

core.get('/user/places', (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Not authenticated' }, 401);
  const places = userService.getSavedPlaces(user.sub);
  return c.json(places);
});

core.post('/user/places', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Not authenticated' }, 401);
  const body = await c.req.json();
  const saved = userService.addSavedPlace(user.sub, body);
  return c.json(saved, 201);
});

// Notifications
core.get('/notifications', (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Not authenticated' }, 401);
  const notifs = getUserNotifications(user.sub);
  return c.json(notifs);
});

core.patch('/notifications/:id/read', (c) => {
  const user = c.get('user');
  if (!user || user.sub === GUEST_SUB) return c.json({ error: 'Not authenticated' }, 401);
  // only the person a notification was sent to can mark it read
  const ok = markNotificationAsRead(c.req.param('id'), user.sub);
  return c.json({ success: ok }, ok ? 200 : 404);
});

app.route('/v1/core', core);

// ==========================================
// MODULE MOUNTING (/v1/m/<module_id>/...)
// ==========================================
// Fault isolation rule: each module is safely mounted. If one crashes, others remain online!
for (const mod of registeredModules) {
  try {
    const cleanId = mod.id.replace(/^m\d+-/, ''); // e.g. m04-utilities -> utilities
    app.route(`/v1/m/${cleanId}`, mod.routes);
    // Also mount with exact id for convenience
    app.route(`/v1/m/${mod.id}`, mod.routes);
    console.log(`[MODULE MOUNTED] ✅ /v1/m/${cleanId} (${mod.id})`);
  } catch (err) {
    console.error(`[MODULE FAILED] ❌ Could not mount module "${mod.id}":`, err);
  }
}

// server.ts (port 8000) imports this app and answers every /v1/m/* module route with it, so there is one set of module
// routes and one set of rules. Running this file directly still starts it alone on port 3001.
const runDirectly = !!process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (runDirectly) {
  const PORT = parseInt(process.env.PORT || '3001', 10);
  console.log(`🚀 Timișoara City Hub API running on http://localhost:${PORT}`);
  serve({ fetch: app.fetch, port: PORT });
}

export default app;
