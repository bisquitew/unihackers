// Comprehensive API Client for Timișoara City Hub Backend (services/api on Port 8000)

const BASE_URL = window.location.port === '8000'
  ? ''
  : 'http://localhost:8000';

// Every request to the API says it comes from the website. The API applies the access rule with it:
// staff (admin) accounts sign in on the website only, residents in the mobile app only.
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (!url.includes('/v1/')) return nativeFetch(input, init);
  const headers = new Headers(init.headers || (typeof input === 'object' ? input.headers : undefined));
  headers.set('X-Hub-Client', 'web');
  // signed-in requests carry the session token unless the caller already set one
  const saved = localStorage.getItem('hub_auth_token');
  if (saved && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${saved}`);
  return nativeFetch(input, { ...init, headers });
};

function getHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- AUTH0 & SECURITY ---
export async function loginWithGoogle({ email, name, role } = {}) {
  const res = await fetch(`${BASE_URL}/v1/core/auth/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, role }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error_description || `Sign-in failed (${res.status})`);
  }
  return await res.json();
}

export async function fetchAuthMe(token = 'dev_resident') {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/auth/me`, { headers: getHeaders(token) });
    return await res.json();
  } catch (err) {
    return { authenticated: false, error: err.message };
  }
}

export async function fetchDevTokens() {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/auth/dev-tokens`);
    return await res.json();
  } catch {
    return { tokens: [] };
  }
}

export async function fetchAuditLogs(limit = 10) {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/auth/audit-log?limit=${limit}`);
    return await res.json();
  } catch {
    return { logs: [] };
  }
}

export async function simulateLocationAnomaly(city, country, ip) {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/auth/simulate-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, country, ip }),
    });
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

// --- TIGER DATA & TIMESCALEDB ---
export async function fetchTigerStatus() {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/tiger/status`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchTigerCompression() {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/tiger/compression`);
    return await res.json();
  } catch {
    return { compression: [] };
  }
}

export async function fetchAnalyticsHeatmap() {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/analytics/heatmap`);
    return await res.json();
  } catch {
    return { heatpoints: [] };
  }
}

// --- AREA DANGER & CONSTRUCTION ALERTS (RADIUS MAPPING & NEIGHBOUR SIGNALING) ---
export async function fetchAreaAlerts(filter = {}) {
  try {
    const params = new URLSearchParams();
    if (filter.type) params.set('type', filter.type);
    if (filter.status) params.set('status', filter.status);
    if (filter.neighbourhood) params.set('neighbourhood', filter.neighbourhood);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/v1/core/area-alerts${qs}`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchAreaAlertById(id) {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/area-alerts/${id}`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function createAreaAlert(token, alertData) {
  const res = await fetch(`${BASE_URL}/v1/core/area-alerts`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(alertData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function checkAreaProximity(query = {}) {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/area-alerts/check-proximity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });
    return await res.json();
  } catch (err) {
    return {
      in_danger_zone: false,
      in_construction_zone: false,
      matching_alerts: [],
      error: err.message
    };
  }
}

// --- M04 UTILITIES ---
export async function fetchOutages() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/utilities/outages`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function checkAddressOutages(address) {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/utilities/outages/check-address?address=${encodeURIComponent(address)}`);
    return await res.json();
  } catch {
    return { affected: false, message: 'Nu s-a putut verifica adresa.' };
  }
}

export async function createOutage(token, outageData) {
  const res = await fetch(`${BASE_URL}/v1/m/utilities/outages`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(outageData),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// --- M05 TRANSIT ---
export async function fetchTransitLines() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/transit/lines`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function checkTransitStop(stopName) {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/transit/check-stop?stop=${encodeURIComponent(stopName)}`);
    return await res.json();
  } catch {
    return { detour: false, message: 'Nu s-a putut verifica stația.' };
  }
}

// --- M06 SMELL & WIND ---
export async function fetchSmellPins() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/smell/pins`);
    return await res.json();
  } catch {
    return { pins: [] };
  }
}

export async function fetchSmellWind() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/smell/wind`);
    return await res.json();
  } catch {
    return { speedKmh: 12, directionDeg: 310, compass: 'NW' };
  }
}

export async function submitSmellReport(data) {
  const res = await fetch(`${BASE_URL}/v1/m/smell/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

// --- M01 EVENTS & COMMUNITY ---
export async function fetchEvents() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/events`);
    const body = await res.json();
    return Array.isArray(body) ? body : body.events || [];
  } catch {
    return [];
  }
}

export async function fetchForumPosts() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/forum`);
    const body = await res.json();
    return Array.isArray(body) ? body : body.posts || [];
  } catch {
    return [];
  }
}

export async function fetchBuddyRequests() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/buddy`);
    const body = await res.json();
    return Array.isArray(body) ? body : body.buddyRequests || [];
  } catch {
    return [];
  }
}

export async function fetchSolanaStatus() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/solana/status`);
    return await res.json();
  } catch {
    return { online: true, cluster: 'devnet' };
  }
}

// --- M10 ASSISTANT ---
export async function askAssistant(message, history = []) {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    return await res.json();
  } catch (err) {
    return { reply: 'Asistentul nu este disponibil momentan.', error: err.message };
  }
}

// --- M11 FEEDBACK ---
export async function fetchFeedbackSummary() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/feedback/summary`);
    return await res.json();
  } catch {
    return { count: 0, byCategory: {} };
  }
}

export async function submitFeedback(data) {
  const res = await fetch(`${BASE_URL}/v1/m/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

// --- M12 DASHBOARD ---
export async function fetchDashboardOverview() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/dashboard/overview`);
    return await res.json();
  } catch {
    return null;
  }
}

// --- PARKIE SMART PARKING ---
export async function fetchLots() {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/parkie/lots`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchLotById(id) {
  try {
    const res = await fetch(`${BASE_URL}/v1/m/parkie/lots/${id}`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveLotPlots(id, payload) {
  const res = await fetch(`${BASE_URL}/v1/m/parkie/lots/${id}/plots`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function sendDetection(lotId, detectedCars) {
  const res = await fetch(`${BASE_URL}/v1/m/parkie/detections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lot_id: lotId, detected_cars: detectedCars }),
  });
  return await res.json();
}

// --- FORUM MODERATION (staff) ---
export async function fetchReportedPosts() {
  const res = await fetch(`${BASE_URL}/v1/m/forum/moderation/reported`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error_description || `Could not load the queue (${res.status})`);
  return (await res.json()).reportedPosts || [];
}
export async function approveReportedPost(id) {
  const res = await fetch(`${BASE_URL}/v1/m/forum/moderation/${encodeURIComponent(id)}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error(`Could not keep the post (${res.status})`);
}
export async function removeReportedPost(id) {
  const res = await fetch(`${BASE_URL}/v1/m/forum/moderation/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Could not remove the post (${res.status})`);
}

// --- generic calls for the community actions (headers and the session token are added by the fetch wrapper above) ---
async function send(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}
export const hubPost = (path, body = {}) => send('POST', path, body);
export const hubGet = (path) => send('GET', path);
