import http from 'node:http';
import { TIMISOARA_AREAS } from './core/areas.ts';
import { userService } from './core/users.ts';
import { getAllFlags } from './core/flags.ts';
import { utilitiesService } from './modules/m04-utilities/service.ts';
import { transitService } from './modules/m05-transit/service.ts';

const PORT = parseInt(process.env.PORT || '8000', 10);

// Simple body parser
async function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: http.ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost:8000'}`);
  const method = req.method?.toUpperCase() || 'GET';
  const pathname = url.pathname;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // Auth Context check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  const isDevAdmin = token === 'dev_admin';
  const currentUser = {
    sub: isDevAdmin ? 'auth0|dev-admin-01' : 'auth0|dev-resident-01',
    email: isDevAdmin ? 'admin@timisoara-hub.ro' : 'resident@timisoara-hub.ro',
    name: isDevAdmin ? 'Admin Primăria TM' : 'Andrei Timișan',
    role: isDevAdmin ? 'admin' : 'resident'
  };

  try {
    // 1. Health
    if (pathname === '/health' && method === 'GET') {
      return sendJson(res, 200, {
        status: 'ok',
        project: 'Timișoara City Hub API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Core Areas
    if (pathname === '/v1/core/areas' && method === 'GET') {
      return sendJson(res, 200, TIMISOARA_AREAS);
    }

    // 3. User & Auth
    if (pathname === '/v1/core/user/me' && method === 'GET') {
      return sendJson(res, 200, currentUser);
    }

    if (pathname === '/v1/core/user/places' && method === 'GET') {
      const places = userService.getSavedPlaces('11111111-2222-3333-4444-555555555555');
      return sendJson(res, 200, places);
    }

    if (pathname === '/v1/core/user/places' && method === 'POST') {
      const body = await parseBody(req);
      const saved = userService.addSavedPlace('11111111-2222-3333-4444-555555555555', body);
      return sendJson(res, 201, saved);
    }

    // 4. Feature Flags
    if (pathname === '/v1/core/flags' && method === 'GET') {
      return sendJson(res, 200, getAllFlags());
    }

    // 5. [M04_UTILITIES] Outages
    if ((pathname === '/v1/m/utilities/outages' || pathname === '/v1/m/m04-utilities/outages') && method === 'GET') {
      const provider = url.searchParams.get('provider') || undefined;
      const statusFilter = url.searchParams.get('status') || undefined;
      const area = url.searchParams.get('area') || undefined;
      const data = utilitiesService.getAllOutages({ provider, status: statusFilter, area });
      return sendJson(res, 200, data);
    }

    if ((pathname === '/v1/m/utilities/check-address' || pathname === '/v1/m/m04-utilities/check-address') && method === 'POST') {
      const body = await parseBody(req);
      const query = body.address || body.area || '';
      const impact = utilitiesService.checkAddressImpact(query);
      return sendJson(res, 200, impact);
    }

    if ((pathname === '/v1/m/utilities/outages' || pathname === '/v1/m/m04-utilities/outages') && method === 'POST') {
      const body = await parseBody(req);
      const created = await utilitiesService.createOutage(body);
      return sendJson(res, 201, created);
    }

    // 6. [M05_TRANSIT] Lines & Detours
    if ((pathname === '/v1/m/transit/lines' || pathname === '/v1/m/m05-transit/lines') && method === 'GET') {
      return sendJson(res, 200, transitService.getAllLines());
    }

    if ((pathname === '/v1/m/transit/detours' || pathname === '/v1/m/m05-transit/detours') && method === 'GET') {
      return sendJson(res, 200, transitService.getAllDetours());
    }

    if ((pathname === '/v1/m/transit/detours' || pathname === '/v1/m/m05-transit/detours') && method === 'POST') {
      const body = await parseBody(req);
      const created = await transitService.addDetourAlert({
        id: body.id || crypto.randomUUID(),
        line_number: body.line_number,
        title: body.title,
        reason: body.reason,
        status: body.status || 'detoured',
        affected_stops: body.affected_stops || [],
        alternative_instructions: body.alternative_instructions,
        replacement_line: body.replacement_line,
        valid_from: body.valid_from || new Date().toISOString()
      });
      return sendJson(res, 201, created);
    }

    if ((pathname === '/v1/m/transit/check-stop' || pathname === '/v1/m/m05-transit/check-stop') && method === 'POST') {
      const body = await parseBody(req);
      const stop = body.stop_name || body.stop || '';
      const result = transitService.checkStopImpact(stop);
      return sendJson(res, 200, result);
    }

    // 404
    return sendJson(res, 404, { error: 'Route not found', path: pathname });
  } catch (err: any) {
    return sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Timișoara City Hub API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Utilities: http://localhost:${PORT}/v1/m/utilities/outages`);
  console.log(`   Transit: http://localhost:${PORT}/v1/m/transit/lines`);
});
