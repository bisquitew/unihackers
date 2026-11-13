import http from 'node:http';
import { TIMISOARA_AREAS } from './core/areas.ts';
import { userService } from './core/users.ts';
import { getAllFlags } from './core/flags.ts';
import { utilitiesService } from './modules/m04-utilities/service.ts';
import { transitService } from './modules/m05-transit/service.ts';
import { parkieService } from './modules/parkie/service.ts';
import { storageService } from './core/storage.ts';

const PORT = parseInt(process.env.PORT || '8000', 10);

// Raw buffer parser for uploads
async function parseRawBuffer(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

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

    // 4b. Photo Upload Service (Vultr Object Storage / signed URLs)
    if (pathname === '/v1/core/upload/signed-url' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.filename || !body.content_type) {
        return sendJson(res, 400, { error: 'Missing filename or content_type in upload request' });
      }
      const signed = storageService.createSignedUploadUrl(body, req.headers.host || `localhost:${PORT}`);
      return sendJson(res, 200, signed);
    }

    if (pathname.startsWith('/v1/core/upload/raw/') && method === 'PUT') {
      const key = decodeURIComponent(pathname.replace('/v1/core/upload/raw/', ''));
      const buffer = await parseRawBuffer(req);
      await storageService.saveLocalFile(key, buffer);
      return sendJson(res, 200, { ok: true, key, size: buffer.length });
    }

    if (pathname.startsWith('/uploads/') && method === 'GET') {
      const key = decodeURIComponent(pathname.replace('/uploads/', ''));
      const file = storageService.getLocalFile(key);
      if (!file) return sendJson(res, 404, { error: 'Uploaded file not found', key });
      res.writeHead(200, {
        'Content-Type': file.contentType,
        'Content-Length': file.data.length,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(file.data);
      return;
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

    // 7. [PARKIE] Real-time Parking Lots & CV Detections
    if (pathname === '/v1/m/parkie/lots' && method === 'GET') {
      const statusColor = url.searchParams.get('status_color') || undefined;
      const minAvailable = url.searchParams.get('min_available') ? parseInt(url.searchParams.get('min_available')!, 10) : undefined;
      const lots = parkieService.getAllLots({ status_color: statusColor, min_available: minAvailable });
      return sendJson(res, 200, lots);
    }

    if (pathname === '/v1/m/parkie/lots/colors' && method === 'GET') {
      return sendJson(res, 200, parkieService.getLotColorsOnly());
    }

    if (pathname === '/v1/m/parkie/nearest' && method === 'GET') {
      const lat = parseFloat(url.searchParams.get('lat') || '45.7578');
      const lng = parseFloat(url.searchParams.get('lng') || '21.2290');
      const limit = parseInt(url.searchParams.get('limit') || '5', 10);
      const nearest = parkieService.findNearestLots(lat, lng, limit);
      return sendJson(res, 200, nearest);
    }

    if (pathname.startsWith('/v1/m/parkie/lots/') && method === 'GET') {
      const id = pathname.replace('/v1/m/parkie/lots/', '');
      const lot = parkieService.getLotById(id);
      if (!lot) return sendJson(res, 404, { error: 'Parking lot not found', id });
      return sendJson(res, 200, lot);
    }

    if (pathname === '/v1/m/parkie/detections' && method === 'POST') {
      const body = await parseBody(req);
      const lotId = body.lot_id;
      const detectedCars = parseInt(body.detected_cars ?? '0', 10);

      if (!lotId) {
        return sendJson(res, 400, { error: 'Missing lot_id in detection payload' });
      }

      const updated = await parkieService.updateDetections(lotId, detectedCars);
      if (!updated) {
        return sendJson(res, 404, { error: 'Parking lot not found for detection update', lotId });
      }

      return sendJson(res, 200, updated);
    }

    if (pathname === '/v1/m/parkie/lots' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.name || body.latitude === undefined || body.longitude === undefined || body.capacity === undefined) {
        return sendJson(res, 400, { error: 'Missing required lot fields: name, latitude, longitude, capacity' });
      }
      const created = await parkieService.createLot(body);
      return sendJson(res, 201, created);
    }

    // 404
    return sendJson(res, 404, { error: 'Route not found', path: pathname });
  } catch (err: any) {
    return sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

function startServer(port: number) {
  server.once('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is in use, falling back to port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Timișoara City Hub API running on http://localhost:${port}`);
    console.log(`   Health: http://localhost:${port}/health`);
    console.log(`   Utilities: http://localhost:${port}/v1/m/utilities/outages`);
    console.log(`   Transit: http://localhost:${port}/v1/m/transit/lines`);
    console.log(`   Parkie: http://localhost:${port}/v1/m/parkie/lots`);
  });
}

startServer(PORT);
