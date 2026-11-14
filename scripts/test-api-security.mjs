// Checks the API's access rules against a running server (default http://localhost:8000, override with API_URL).
//   node scripts/test-api-security.mjs
// Needs the demo sign-in on (DEMO_AUTH, the default outside production).
const API = (process.env.API_URL || 'http://localhost:8000').replace(/\/+$/, '');
let failed = 0;

async function call(method, path, { token, body, raw, client } = {}) {
  const headers = { ...(raw ? {} : { 'Content-Type': 'application/json' }) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (client) headers['X-Hub-Client'] = client;
  const res = await fetch(API + path, { method, headers, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
  let json = null;
  try { json = await res.json(); } catch { /* not json */ }
  return { status: res.status, json };
}
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failed += 1;
}

// --- sign-in: the role is decided by the server, never by the request ---
let r = await call('POST', '/v1/core/auth/google-login', { body: { email: 'visitor@gmail.com', name: 'V', role: 'admin' } });
check('asking for the admin role does not give it (google-login)', r.json?.user?.role === 'resident', JSON.stringify(r.json?.user?.role));
r = await call('POST', '/v1/core/auth/google-login', { body: { email: 'admin.fan@gmail.com', name: 'V' } });
check('an email containing "admin" is not enough', r.json?.user?.role === 'resident', JSON.stringify(r.json?.user?.role));
const residentToken = r.json?.token;
r = await call('POST', '/v1/core/auth/google-login', { body: { email: 'elena@timisoara-hub.ro', name: 'Elena' } });
check('a staff email becomes an admin (demo mode)', r.json?.user?.role === 'admin', JSON.stringify(r.json?.user?.role));
r = await call('POST', '/v1/core/auth/login', { body: { email: 'someone@example.com', role: 'admin' } });
check('asking for admin on /auth/login does not give it', r.json?.user?.role === 'resident' && r.json?.token === 'dev_resident', JSON.stringify(r.json?.token));
check('the token is not guessable', /^google_[0-9a-f]{32}$/.test(residentToken || ''), residentToken);

// --- the client rule: staff only on the website ---
r = await call('GET', '/v1/core/auth/me', { token: 'dev_admin_mfa', client: 'app' });
check('an admin token is a guest inside the app', r.json?.sub === 'guest|unauthenticated', r.json?.sub);
r = await call('GET', '/v1/core/auth/me', { token: 'dev_admin_mfa', client: 'web' });
check('an admin token works on the website', r.json?.role === 'admin', r.json?.role);

// --- writes need a user ---
r = await call('POST', '/v1/m/events', { body: { title: 'x' } });
check('creating an event without signing in is refused', r.status === 401, r.status);
r = await call('POST', '/v1/m/forum/posts', { body: { title: 'x', content: 'y' } });
check('posting to the forum without signing in is refused', r.status === 401, r.status);
r = await call('POST', '/v1/m/solana/tickets/mint', { body: { eventId: 'e', eventTitle: 't' } });
check('minting a ticket without signing in is refused', r.status === 401, r.status);
r = await call('GET', '/v1/core/user/places');
check('saved places need a sign-in', r.status === 401, r.status);

// --- staff only ---
r = await call('POST', '/v1/m/parkie/detections', { token: residentToken, body: { lot_id: 'x', detected_cars: 1 } });
check('a resident cannot send parking detections', r.status === 403, r.status);
r = await call('POST', '/v1/m/parkie/detections', { token: 'dev_admin_mfa', body: { lot_id: 'no-such-lot', detected_cars: 1 } });
check('an admin can (404 for an unknown lot, not 401/403)', r.status === 404, r.status);

// --- uploads ---
r = await call('PUT', '/v1/core/upload/raw/..%2f..%2fpackage.json', { raw: 'x' });
check('uploading without signing in is refused', r.status === 401, r.status);
r = await call('PUT', '/v1/core/upload/raw/..%2f..%2fpackage.json', { token: residentToken, raw: 'x' });
check('an upload path that leaves the uploads folder is refused', r.status === 400, r.status);
r = await call('GET', '/uploads/..%2f..%2fpackage.json');
check('files outside the uploads folder cannot be read', r.status === 404, r.status);
r = await call('POST', '/v1/core/upload/signed-url', { token: residentToken, body: { filename: 'a.exe', content_type: 'application/x-msdownload' } });
check('only images can be uploaded', r.status === 400, r.status);

// --- the community flows work for a signed-in resident ---
const me = (await call('GET', '/v1/core/auth/me', { token: residentToken })).json;
r = await call('POST', '/v1/m/events', { token: residentToken, body: { title: 'Test night', description: 'd', category: 'social', locationName: 'Somewhere', address: 'A', neighbourhood: 'Cetate', latitude: 45.75, longitude: 21.22, dateTime: '2026-12-01T18:00:00Z', organizerName: 'T' } });
check('a signed-in resident can host an event', r.status === 201, r.status);
const eventId = r.json?.event?.id;
r = await call('POST', `/v1/m/events/${eventId}/rsvp`, { token: residentToken, body: { userName: 'T' } });
check('and RSVP to it', r.status === 201, r.status);

r = await call('POST', '/v1/m/forum', { token: residentToken, body: { title: 'Hello', content: 'World', category: 'help', neighbourhood: 'Cetate', authorName: 'Someone Else' } });
const postId = r.json?.post?.id;
check('a resident can post, and the author is them (not the name in the body)', r.status === 201 && r.json?.post?.authorId === me.sub && r.json?.post?.authorName === me.name, JSON.stringify(r.json?.post?.authorName));
r = await call('POST', `/v1/m/forum/${postId}/upvote`, { token: residentToken });
check('upvoting counts once', r.json?.upvoted === true && r.json?.upvotes === 1, JSON.stringify(r.json));
r = await call('POST', `/v1/m/forum/${postId}/upvote`, { token: residentToken });
check('upvoting again takes it back', r.json?.upvoted === false && r.json?.upvotes === 0, JSON.stringify(r.json));
r = await call('POST', `/v1/m/forum/${postId}/comments`, { token: residentToken, body: { content: 'Nice' } });
check('a resident can comment', r.status === 201, r.status);
r = await call('POST', `/v1/m/forum/${postId}/report`, { token: residentToken, body: { reason: 'spam' } });
r = await call('POST', `/v1/m/forum/${postId}/report`, { token: residentToken, body: { reason: 'spam' } });
r = await call('GET', '/v1/m/forum', { token: residentToken });
const mine = (r.json?.posts || []).find((p) => p.id === postId);
check('reporting twice counts once, and the viewer sees their own state', mine?.reportCount === 1 && mine?.viewerReported === true, JSON.stringify([mine?.reportCount, mine?.viewerReported]));
r = await call('GET', '/v1/m/forum/moderation/reported', { token: residentToken });
check('a resident cannot open the moderation queue', r.status === 403, r.status);
r = await call('GET', '/v1/m/forum/moderation/reported', { token: 'dev_admin_mfa', client: 'web' });
check('an admin on the website can', r.status === 200, r.status);
r = await call('DELETE', `/v1/m/forum/moderation/${postId}`, { token: 'dev_admin_mfa', client: 'web' });
check('and remove a post', r.status === 200, r.status);

r = await call('POST', '/v1/m/buddy', { token: residentToken, body: { eventId: 'evt-001', userName: 'T', interests: ['jazz'], userId: 'someone-else' } });
check('a resident can ask for company, as themselves', r.status === 201 && r.json?.buddyRequest?.userId === me.sub, JSON.stringify(r.json?.buddyRequest?.userId));

r = await call('POST', '/v1/core/area-alerts', { token: residentToken, body: { title: 'x', type: 'danger', latitude: 45.7, longitude: 21.2, radius_meters: 100 } });
check('a resident cannot publish an area alert', r.status === 403, r.status);
r = await call('POST', '/v1/core/area-alerts', { token: 'dev_admin_mfa', client: 'web', body: { title: 'Test works', type: 'construction', latitude: 45.7, longitude: 21.2, radius_meters: 100 } });
check('an admin can', r.status === 201, r.status);

// --- bad input ---
r = await call('POST', '/v1/core/auth/google-login', { raw: '{not json' });
check('invalid JSON is a 400, not a silent empty body', r.status === 400, r.status);

console.log(failed ? `\n${failed} check(s) failed` : '\nAll access checks passed');
process.exit(failed ? 1 : 0);
