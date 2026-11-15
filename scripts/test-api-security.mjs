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
r = await call('POST', '/v1/core/auth/google-login', { body: { email: 'admin.elena@timisoara-hub.ro', name: 'Elena' } });
check('a listed staff email becomes an admin (demo mode)', r.json?.user?.role === 'admin', JSON.stringify(r.json?.user?.role));
r = await call('POST', '/v1/core/auth/google-login', { body: { email: 'resident@timisoara-hub.ro', name: 'R' } });
check('the city mail domain alone is not staff', r.json?.user?.role === 'resident', JSON.stringify(r.json?.user?.role));
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

// --- outages: confirming needs an account and counts once; publishing is for staff ---
const outageId = (await call('GET', '/v1/m/utilities/outages')).json?.[0]?.id;
r = await call('POST', `/v1/m/utilities/confirm/${outageId}`);
check('confirming an outage without signing in is refused', r.status === 401, r.status);
r = await call('POST', `/v1/m/utilities/confirm/${outageId}`, { token: residentToken });
const firstCount = r.json?.confirmations_count;
r = await call('POST', `/v1/m/utilities/confirm/${outageId}`, { token: residentToken });
check('confirming twice counts once', r.status === 200 && r.json?.confirmations_count === firstCount, JSON.stringify([firstCount, r.json?.confirmations_count]));
r = await call('POST', '/v1/m/utilities/outages', { token: residentToken, body: { title: 'x' } });
check('a resident cannot publish an outage', r.status === 403, r.status);
r = await call('POST', '/v1/m/transit/detours', { token: residentToken, body: { line_number: '1' } });
check('a resident cannot publish a detour', r.status === 403, r.status);

// --- notifications: only the owner can mark one read ---
r = await call('PATCH', '/v1/core/notifications/some-id/read');
check('marking a notification read needs a sign-in', r.status === 401, r.status);
r = await call('PATCH', '/v1/core/notifications/not-mine/read', { token: residentToken });
check('a notification that is not yours is not found', r.status === 404, r.status);

// --- events: an RSVP is always for the signed-in person ---
const anyEvent = (await call('GET', '/v1/m/events')).json?.events?.[0]?.id || (await call('GET', '/v1/m/events')).json?.[0]?.id;
r = await call('POST', `/v1/m/events/${anyEvent}/rsvp`, { token: residentToken, body: { userId: 'someone-else', userName: 'Someone Else' } });
check('an RSVP cannot be made in someone else\'s name', r.status === 201 && r.json?.rsvp?.userId === me.sub && r.json?.rsvp?.userName === me.name, JSON.stringify([r.status, r.json?.rsvp?.userId, r.json?.rsvp?.userName]));

// --- buddy chats: you are always in a chat you open, and only participants can write ---
r = await call('POST', '/v1/m/buddy/chats', { token: residentToken, body: { eventId: 'evt-sec', eventTitle: 'Sec', participantIds: ['other-user'], participantNames: ['Other'] } });
const chatId = r.json?.chat?.id;
check('opening a chat puts you in it', (r.json?.chat?.participantIds || []).includes(me.sub), JSON.stringify(r.json?.chat?.participantIds));
r = await call('POST', `/v1/m/buddy/chats/${chatId}/messages`, { token: residentToken, body: { senderId: 'other-user', senderName: 'Other', content: 'hi' } });
check('a message is sent as you, not as the name in the body', r.status === 201 && r.json?.message?.senderId === me.sub, JSON.stringify([r.status, r.json?.message?.senderId]));
r = await call('POST', `/v1/m/buddy/chats/${chatId}/messages`, { token: 'dev_resident', body: { content: 'let me in' } });
check('someone outside the chat cannot write in it', r.status === 403, r.status);

// --- wallet: door check-in is for hosts; a badge needs your own ticket ---
r = await call('POST', '/v1/m/wallet/check-in', { token: residentToken, body: { ticketId: 'x' } });
check('a resident cannot check in tickets at the door', r.status === 403, r.status);
r = await call('POST', '/v1/m/solana/poap/mint', { token: residentToken, body: { eventId: 'evt-no-ticket', eventTitle: 'x' } });
check('a badge without a ticket is refused', r.status === 403, r.status);

// --- feedback analytics: for staff only ---
r = await call('GET', '/v1/m/feedback/analytics');
check('a guest cannot read the feedback analytics', r.status === 403, r.status);
r = await call('GET', '/v1/m/feedback/analytics', { token: residentToken });
check('a resident cannot read the feedback analytics', r.status === 403, r.status);
r = await call('GET', '/v1/m/feedback/analytics', { token: 'dev_admin_mfa', client: 'web' });
check('an admin on the website can, and it never states how many people answered', r.status === 200 && !/responses|"count"|"total"/i.test(JSON.stringify(r.json)), r.status);

// --- safe places: public, filterable, sorted by distance; the assistant's location is validated ---
r = await call('GET', '/v1/m/safety/places');
check('safe places are public and include hospitals, police and fire stations', r.status === 200 && ['hospital', 'police', 'fire'].every((k) => r.json?.places?.some((p) => p.kind === k)), r.status);
r = await call('GET', '/v1/m/safety/places?lat=45.745&lng=21.205&kind=police&limit=3');
const dists = (r.json?.places || []).map((p) => p.distance_meters);
check('places near a spot come back nearest first', r.status === 200 && dists.length === 3 && dists.every((d, i) => i === 0 || d >= dists[i - 1]), JSON.stringify(dists));
r = await call('GET', '/v1/m/safety/places?kind=bank');
check('an unknown kind of place is refused', r.status === 400, r.status);
r = await call('GET', '/v1/m/safety/places?lat=45.7');
check('a latitude without a longitude is refused', r.status === 400, r.status);
r = await call('POST', '/v1/m/assistant/chat', { body: { message: 'hi', location: { latitude: 'north', longitude: 21 } } });
check('a bad location sent to the assistant is refused', r.status === 400, r.status);
r = await call('POST', '/v1/core/area-alerts/check-proximity', { body: { address: 'Circumvalațiunii' } });
check('the danger-zone check also names the nearest safe place', !!r.json?.nearest_safe_place?.name && r.json.nearest_safe_place.distance_meters >= 0, JSON.stringify(r.json?.nearest_safe_place));

// --- map search: open to everyone, short queries are empty, long ones refused ---
r = await call('GET', '/v1/core/places/search?q=ab');
check('a search shorter than 3 letters answers with no places', r.status === 200 && Array.isArray(r.json?.places) && r.json.places.length === 0, r.status);
r = await call('GET', `/v1/core/places/search?q=${'x'.repeat(130)}`);
check('a search longer than 120 characters is refused', r.status === 400, r.status);
r = await call('GET', '/v1/core/places/search?q=Gara%20de%20Nord');
check('the map search needs no sign-in and finds places', r.status === 200 && r.json?.places?.length > 0 && r.json.places.every((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)), r.status);
r = await call('GET', '/v1/core/places/search?q=Pia%C8%9Ba%20Unirii');
check('Romanian letters like ț still find the square', r.status === 200 && r.json?.places?.some((p) => /unirii/i.test(p.name)), JSON.stringify((r.json?.places || []).map((p) => p.name)));

// --- directions: open to everyone, only inside the city, checked against the danger zones ---
r = await call('GET', '/v1/core/route?from=45.75,21.20');
check('a route without a destination is refused', r.status === 400, r.status);
r = await call('GET', '/v1/core/route?from=48.85,2.35&to=45.75,21.23');
check('a route starting outside the city is refused', r.status === 400, r.status);
r = await call('GET', '/v1/core/route?from=45.75,21.20&to=45.757,21.23&mode=jetpack');
check('an unknown way of travelling is refused', r.status === 400, r.status);
r = await call('GET', '/v1/core/route?from=45.7500,21.2030&to=45.7570,21.2300&mode=foot');
if (r.status === 200) {
  check('a route needs no sign-in and has a line, a time and steps', r.json.geometry?.length > 2 && r.json.duration_s > 0 && r.json.steps?.length > 0, r.status);
  check('a walk across the gas-leak zone goes round it, or says plainly it could not', r.json.avoided?.length > 0 || r.json.could_not_avoid === true || r.json.warnings?.length > 0, JSON.stringify(r.json.warnings));
} else {
  console.log(`  (skipped the live route checks: the routing service answered ${r.status})`);
}

// --- tour walking directions ---
r = await call('GET', '/v1/m/assistant/tour/walk?lang=en&from=48.85,2.35');
check('tour directions from a spot outside the city are refused', r.status === 400, r.status);
r = await call('GET', '/v1/m/assistant/tour/walk?lang=ro');
if (r.status === 200) check('the tour walk has a leg for every stop after the first, each with a spoken passage', r.json.legs?.length >= 1 && r.json.legs.every((l) => l.spoken?.length > 20 && l.steps?.length > 0), JSON.stringify(r.json).slice(0, 120));
else console.log(`  (skipped the live tour walk check: the routing service answered ${r.status})`);

// --- bad input ---
r = await call('POST', '/v1/core/auth/google-login', { raw: '{not json' });
check('invalid JSON is a 400, not a silent empty body', r.status === 400, r.status);

console.log(failed ? `\n${failed} check(s) failed` : '\nAll access checks passed');
process.exit(failed ? 1 : 0);
