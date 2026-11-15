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
export async function loginWithGoogle({ email, name } = {}) {
  // Security: client NEVER sends role; server strictly controls identity and permissions
  const res = await fetch(`${BASE_URL}/v1/core/auth/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error_description || `Sign-in failed (${res.status})`);
  }
  return await res.json();
}

export async function loginWithEmail({ email, password, token } = {}) {
  const res = await fetch(`${BASE_URL}/v1/core/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, token }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error_description || `Sign-in failed (${res.status})`);
  }
  return await res.json();
}



/** The Auth0 tenant settings the website needs to start the login (domain, audience, client id). */
export async function fetchAuth0Info() {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/auth/auth0-info`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAuthMe(token = 'dev_resident') {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/auth/me`, { headers: getHeaders(token) });
    return await res.json();
  } catch (err) {
    return { authenticated: false, error: err.message };
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


// --- TIGER DATA & TIMESCALEDB ---
export async function fetchTigerStatus() {
  try {
    const res = await fetch(`${BASE_URL}/v1/core/tiger/status`);
    return await res.json();
  } catch {
    return null;
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
    const res = await fetch(`${BASE_URL}/v1/m/utilities/check-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
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

// --- M10 NOTICE SCANNER (P4): photo of a printed notice -> Gemini draft -> staff publish ---
/** Sends a photo; Gemini returns { isNotice, reason, draft, warnings }. Nothing is saved. */
export async function parseNoticePhoto(file) {
  const form = new FormData();
  form.append('image', file, file.name || 'notice.jpg');
  const res = await fetch(`${BASE_URL}/v1/m/assistant/notice/parse`, { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Publishes the checked draft as an outage. Needs a staff session with the second check (MFA). */
export async function confirmNotice(token, draft) {
  const res = await fetch(`${BASE_URL}/v1/m/assistant/notice/confirm`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(draft),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error_description || data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// --- M10 ASK THE DATA (P4): staff question -> Gemini fetches data, runs Python, draws a chart ---
/** Returns { answer, charts: [{ mimeType, data }], steps, model, ms }. Staff session only. */
export async function askAnalyst(token, question, lang) {
  const res = await fetch(`${BASE_URL}/v1/m/assistant/analyst`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ question, lang }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || `HTTP ${res.status}`);
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
    const res = await fetch(`${BASE_URL}/v1/m/transit/check-stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stop: stopName }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
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
    return { reply: 'The assistant is not available right now.', error: err.message };
  }
}

// --- M11 FEEDBACK ---


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


export async function saveLotPlots(id, payload) {
  const res = await fetch(`${BASE_URL}/v1/m/parkie/lots/${id}/plots`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
