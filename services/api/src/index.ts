import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { registeredApiModules } from './modules';

const app = new Hono();

// Global Middlewares
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Root health check & info
app.get('/', (c) => {
  return c.json({
    project: 'Timișoara City Hub API',
    hackathon: 'UNIHACK 2026',
    status: 'online',
    mountedModules: registeredApiModules.map((m) => m.id),
  });
});

// Dynamic mounting with fault isolation (Rule 8)
for (const mod of registeredApiModules) {
  try {
    const routePrefix = `/v1/m/${mod.id.replace(/^m\d+-/, '')}`;
    app.route(routePrefix, mod.routes);
    // Also mount with exact module id for direct contract access
    app.route(`/v1/m/${mod.id}`, mod.routes);
    console.log(`[Module Mounted] ${mod.id} -> ${routePrefix}`);
  } catch (err) {
    console.error(`[Module Failed to Mount] ${mod.id}:`, err);
  }
}

const PORT = Number(process.env.PORT) || 3001;

console.log(`🚀 Timișoara City Hub API running on http://localhost:${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});

export default app;
