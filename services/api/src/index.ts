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
import { geocode } from './core/geocode.ts';
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
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  if (/^\/v1\/m\/(events|m01-events|buddy|m07-buddy|forum|m08-forum|wallet|m09-wallet)(\/|$)/.test(path) && !signedIn) {
    return c.json({ error: 'login_required', error_description: 'Sign in to do this.' }, 401);
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
  const id = c.req.param('id');
  const ok = markNotificationAsRead(id);
  return c.json({ success: ok });
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
