import 'dotenv/config';
import http from 'node:http';
import { TIMISOARA_AREAS } from './core/areas.ts';
import { userService } from './core/users.ts';
import { getAllFlags } from './core/flags.ts';
import { eventBus } from './core/events.ts';
import { utilitiesService } from './modules/m04-utilities/service.ts';
import { transitService } from './modules/m05-transit/service.ts';
import { parkieService } from './modules/parkie/service.ts';
import { storageService } from './core/storage.ts';
import { db } from './core/db.ts';
import { 
  resolveAuthUser, 
  enforceSecurityPolicy, 
  getDevTokensCatalog, 
  getAuditLogs,
  handleLoginLocationCheck,
  getSecurityEmails,
  trustLocation,
  isLocationTrusted
} from './core/auth.ts';
import {
  getLiveDevnetStatus,
  broadcastRealTicket,
  broadcastRealPoap,
  ORGANIZER_WALLET_ADDRESS,
  mintDevnetTicket,
  mintDevnetPoap,
} from '../../../packages/solana/src/index.ts';

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

  // Auth Context resolution (supports dev tokens, Auth0 RS256 JWTs, and M2M AI agents)
  const authHeader = req.headers.authorization || '';
  const currentUser = await resolveAuthUser(authHeader);

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

    // 3. User & Auth0 Security (Sponsor Challenge)
    if ((pathname === '/v1/core/user/me' || pathname === '/v1/core/auth/me') && method === 'GET') {
      return sendJson(res, 200, currentUser);
    }

    if (pathname === '/v1/core/auth/dev-tokens' && method === 'GET') {
      return sendJson(res, 200, getDevTokensCatalog());
    }

    if (pathname === '/v1/core/auth/audit-log' && method === 'GET') {
      const authCheck = enforceSecurityPolicy(currentUser, 'auth.view_audit', {
        requiredRoles: ['admin', 'moderator'],
        ip: req.socket.remoteAddress
      });
      if (!authCheck.authorized) {
        return sendJson(res, authCheck.status, authCheck.body);
      }
      return sendJson(res, 200, await getAuditLogs());
    }

    if (pathname === '/v1/core/auth/simulate-mfa' && method === 'POST') {
      const body = await parseBody(req);
      const role = body.role || currentUser.role;
      const factor = body.factor || 'totp_authenticator';
      const upgradedToken = role === 'moderator' ? 'dev_moderator_mfa' : 'dev_admin_mfa';
      return sendJson(res, 200, {
        ok: true,
        message: 'MFA Step-Up Challenge verified successfully! Use the upgraded token for high-privilege operations.',
        factor,
        upgraded_token: upgradedToken,
        example_header: `Authorization: Bearer ${upgradedToken}`,
        amr: ['pwd', 'mfa', factor],
        security_tier: 'tier_2_mfa_verified'
      });
    }

    // Simulate login attempt & test new location anomaly detection
    if (pathname === '/v1/core/auth/simulate-login' && method === 'POST') {
      const body = await parseBody(req);
      const targetUser = body.token ? await resolveAuthUser(`Bearer ${body.token}`) : currentUser;
      
      const location = {
        city: body.city || body.location?.city || 'București',
        country: body.country || body.location?.country || 'România',
        area_name: body.area_name || body.location?.area_name,
        ip: body.ip || body.location?.ip || req.socket.remoteAddress || '86.120.45.12',
        device: body.device || body.location?.device || 'Chrome / Mobile App',
        is_trusted: false
      };

      const checkResult = await handleLoginLocationCheck(targetUser, location);
      return sendJson(res, 200, {
        ok: true,
        user: {
          sub: targetUser.sub,
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role
        },
        location_evaluated: location,
        is_new_location: checkResult.is_new_location,
        step_up_required: checkResult.step_up_required,
        push_notification_sent: !!checkResult.push_notification,
        push_notification: checkResult.push_notification,
        email_alert_sent: !!checkResult.security_email,
        security_email: checkResult.security_email,
        message: checkResult.is_new_location 
          ? `🚨 New location detected (${location.city}, ${location.country})! Push notification & security warning email dispatched.` 
          : `✓ Location (${location.city}, ${location.country}) is recognized as trusted.`
      });
    }

    // Inspect sent security warning emails
    if (pathname === '/v1/core/auth/security-emails' && method === 'GET') {
      const email = url.searchParams.get('email') || undefined;
      const emails = getSecurityEmails(email);
      return sendJson(res, 200, {
        ok: true,
        count: emails.length,
        emails
      });
    }

    // Trust new location (confirm "Yes, it was me")
    if (pathname === '/v1/core/auth/trust-location' && (method === 'POST' || method === 'GET')) {
      let sub = url.searchParams.get('sub') || currentUser.sub;
      let city = url.searchParams.get('city') || 'București';
      let country = url.searchParams.get('country') || 'România';
      let ip = url.searchParams.get('ip') || '86.120.45.12';

      if (method === 'POST') {
        const body = await parseBody(req);
        if (body.sub) sub = body.sub;
        if (body.city) city = body.city;
        if (body.country) country = body.country;
        if (body.ip) ip = body.ip;
      }

      trustLocation(sub, { city, country, ip, is_trusted: true });
      return sendJson(res, 200, {
        ok: true,
        trusted: true,
        message: `Location "${city}, ${country}" added to trusted locations for user "${sub}".`
      });
    }

    // Block session and enforce step-up MFA (confirm "No, it wasn't me")
    if (pathname === '/v1/core/auth/block-session' && (method === 'POST' || method === 'GET')) {
      const sub = url.searchParams.get('sub') || currentUser.sub;
      const alertId = url.searchParams.get('alert_id') || 'manual_block';

      await eventBus.emit('auth.session_blocked', {
        userSub: sub,
        alertId,
        enforceMfa: true,
        timestamp: new Date().toISOString()
      });

      return sendJson(res, 200, {
        ok: true,
        session_blocked: true,
        mfa_enforced: true,
        message: 'Suspicious session blocked! High-privilege actions will require re-authentication with MFA.'
      });
    }

    if (pathname === '/v1/core/auth/webhook' && method === 'POST') {
      const body = await parseBody(req);
      const eventType = body.event_type || body.type || 'post_login';
      const userSub = body.user_id || body.sub || 'auth0|webhook-user';
      const email = body.email || 'user@timisoara-hub.ro';

      console.log(`📡 [AUTH0 WEBHOOK] Event "${eventType}" received for user "${email}"`);

      let locationCheckResult: any = null;
      if (body.location || body.geoip || body.city) {
        const location = {
          city: body.location?.city || body.geoip?.city_name || body.city || 'Timișoara',
          country: body.location?.country || body.geoip?.country_name || body.country || 'România',
          area_name: body.location?.area_name || body.area_name,
          ip: body.ip || body.location?.ip || req.socket.remoteAddress || '127.0.0.1',
          device: body.device || body.user_agent,
          is_trusted: false
        };

        const mockUser: any = {
          sub: userSub,
          email,
          name: body.name || email.split('@')[0],
          role: body.role || 'resident',
          mfa_verified: false,
          amr: ['pwd']
        };

        locationCheckResult = await handleLoginLocationCheck(mockUser, location);
      }

      if (eventType.includes('suspicious') || eventType.includes('failed_mfa') || locationCheckResult?.is_new_location) {
        await eventBus.emit('auth.suspicious_activity', {
          eventType,
          userSub,
          email,
          ip: body.ip || req.socket.remoteAddress,
          isNewLocation: locationCheckResult?.is_new_location,
          timestamp: new Date().toISOString()
        });
      }

      return sendJson(res, 200, {
        ok: true,
        received: true,
        event_type: eventType,
        location_alert_triggered: locationCheckResult?.is_new_location || false,
        timestamp: new Date().toISOString()
      });
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
      const authCheck = enforceSecurityPolicy(currentUser, 'utilities.outages_create', {
        requiredRoles: ['admin'],
        requireMfa: true,
        ip: req.socket.remoteAddress
      });
      if (!authCheck.authorized) {
        return sendJson(res, authCheck.status, authCheck.body);
      }
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
      const authCheck = enforceSecurityPolicy(currentUser, 'transit.detours_create', {
        requiredRoles: ['admin'],
        requireMfa: true,
        ip: req.socket.remoteAddress
      });
      if (!authCheck.authorized) {
        return sendJson(res, authCheck.status, authCheck.body);
      }
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
        valid_from: body.valid_from || new Date().toISOString(),
        created_at: new Date().toISOString()
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

    // 8. [TIGER DATA / TIMESCALEDB] Hypertables & Continuous Aggregates (Sponsor Challenge)
    if (pathname === '/v1/core/tiger/status' && method === 'GET') {
      const status = await db.getTigerStatus();
      return sendJson(res, 200, status);
    }

    if (pathname === '/v1/core/tiger/compression' && method === 'GET') {
      const status = await db.getTigerStatus();
      return sendJson(res, 200, status.compression);
    }

    if (pathname === '/v1/m/parkie/analytics/hourly' && method === 'GET') {
      const lotId = url.searchParams.get('lot_id') || undefined;
      const hours = parseInt(url.searchParams.get('hours') || '24', 10);
      const analytics = await parkieService.getHourlyAnalytics(lotId, hours);
      return sendJson(res, 200, analytics);
    }

    if (pathname === '/v1/core/analytics/city-metrics' && method === 'GET') {
      const metricType = url.searchParams.get('metric_type') || undefined;
      const areaId = url.searchParams.get('area_id') || undefined;
      const hours = parseInt(url.searchParams.get('hours') || '24', 10);
      const metrics = await parkieService.getCityMetricsAnalytics(metricType, areaId, hours);
      return sendJson(res, 200, metrics);
    }

    if (pathname === '/v1/core/metrics/ingest' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.metric_type || !body.area_id || body.value === undefined) {
        return sendJson(res, 400, { error: 'Missing required metric fields: metric_type, area_id, value' });
      }
      const ingested = await parkieService.ingestCityMetric(body);
      return sendJson(res, 201, ingested);
    }

    // 9. Open Data Back to the City (Anonymized continuous aggregate datasets)
    if (pathname === '/v1/core/open-data/export' && method === 'GET') {
      const openData = await parkieService.getOpenDataExport();
      return sendJson(res, 200, openData);
    }

    // --- Solana Devnet Endpoints [M09_WALLET & M01_EVENTS] ---
    if (pathname === '/v1/m/solana/status' && method === 'GET') {
      const status = await getLiveDevnetStatus();
      return sendJson(res, 200, {
        ...status,
        organizerWallet: ORGANIZER_WALLET_ADDRESS,
        faucetUrl: 'https://faucet.solana.com',
      });
    }

    if (pathname === '/v1/m/solana/tickets/mint' && method === 'POST') {
      const body = await parseBody(req);
      const { eventId, eventTitle, attendeeName, attendeeWallet } = body;
      if (!eventId || !eventTitle) {
        return sendJson(res, 400, { error: 'Missing required fields: eventId, eventTitle' });
      }

      const ticketId = `tkt-sol-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const realTx = await broadcastRealTicket(
        ticketId,
        eventId,
        eventTitle,
        attendeeWallet || ORGANIZER_WALLET_ADDRESS
      );

      return sendJson(res, 200, {
        ticketId,
        eventId,
        eventTitle,
        ownerWallet: attendeeWallet || ORGANIZER_WALLET_ADDRESS,
        attendeeName: attendeeName || 'Cetățean Timișoara',
        txSignature: realTx.signature || `pending-${Date.now().toString(36)}`,
        explorerUrl: realTx.explorerUrl,
        isCheckedIn: false,
        onChainConfirmed: realTx.onChainConfirmed,
        slot: realTx.slot,
        mintedAt: new Date().toISOString(),
        message: realTx.message || realTx.error,
        qrPayload: JSON.stringify({
          hub: 'TimisoaraHub',
          ticketId,
          eventId,
          wallet: attendeeWallet || ORGANIZER_WALLET_ADDRESS,
          sig: (realTx.signature || 'pending').slice(0, 16),
        }),
      });
    }

    if (pathname === '/v1/m/solana/poap/mint' && method === 'POST') {
      const body = await parseBody(req);
      const { eventId, eventTitle, attendeeWallet, ticketId } = body;
      if (!eventId) {
        return sendJson(res, 400, { error: 'Missing required field: eventId' });
      }

      const realTx = await broadcastRealPoap(
        eventId,
        eventTitle || 'Eveniment Cultural Timișoara',
        attendeeWallet || ORGANIZER_WALLET_ADDRESS,
        ticketId || 'tkt-scan'
      );

      return sendJson(res, 200, {
        poapId: `poap-${eventId}-${Date.now().toString(36)}`,
        eventId,
        eventTitle: eventTitle || 'Eveniment Cultural Timișoara',
        attendeeWallet: attendeeWallet || ORGANIZER_WALLET_ADDRESS,
        badgeName: `Timișoara Culture Explorer: ${eventTitle || 'Eveniment'}`,
        txSignature: realTx.signature,
        explorerUrl: realTx.explorerUrl,
        onChainConfirmed: realTx.onChainConfirmed,
        slot: realTx.slot,
        issuedAt: new Date().toISOString(),
        message: realTx.message || realTx.error,
      });
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
    console.log(`   Auth0 Profile: http://localhost:${port}/v1/core/auth/me`);
    console.log(`   Auth0 Dev Tokens: http://localhost:${port}/v1/core/auth/dev-tokens`);
    console.log(`   Auth0 Audit Log: http://localhost:${port}/v1/core/auth/audit-log`);
    console.log(`   Auth0 Security Emails: http://localhost:${port}/v1/core/auth/security-emails`);
    console.log(`   Auth0 Location Anomaly: http://localhost:${port}/v1/core/auth/simulate-login`);
    console.log(`   Utilities: http://localhost:${port}/v1/m/utilities/outages`);
    console.log(`   Transit: http://localhost:${port}/v1/m/transit/lines`);
    console.log(`   Parkie: http://localhost:${port}/v1/m/parkie/lots`);
    console.log(`   Tiger Status: http://localhost:${port}/v1/core/tiger/status`);
    console.log(`   Tiger Aggregates: http://localhost:${port}/v1/m/parkie/analytics/hourly`);
    console.log(`   Open Data: http://localhost:${port}/v1/core/open-data/export`);
    console.log(`   Solana Status: http://localhost:${port}/v1/m/solana/status`);
  });
}

startServer(PORT);
