import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { authMiddleware } from './core/auth';
import { TIMISOARA_AREAS } from './core/areas';
import { userService } from './core/users';
import { getUserNotifications, markNotificationAsRead } from './core/notifications';
import { getAllFlags } from './core/flags';
import { registeredModules } from './modules/index';

type AppVariables = {
  user?: any;
};

const app = new Hono<{ Variables: AppVariables }>();

// Middlewares
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use('*', authMiddleware);

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

const PORT = parseInt(process.env.PORT || '3001', 10);
console.log(`🚀 Timișoara City Hub API running on http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});

export default app;
