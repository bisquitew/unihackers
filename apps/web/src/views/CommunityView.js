import { fetchBuddyRequests, fetchEvents, fetchForumPosts, hubGet, hubPost } from '../api.js';
import { art, esc, row, when } from '../ui.js';
import { CITY } from '../city.js';

// the neighbourhoods an event or post can belong to, with the middle of each (used when a venue cannot be found on the map)
const AREAS = {
  Cetate: [45.7537, 21.2272], Fabric: [45.7533, 21.2508], Iosefin: [45.745, 21.209], Elisabetin: [45.7412, 21.2261],
  Mehala: [45.7705, 21.2105], 'Complex Studențesc': [45.748, 21.239], Circumvalațiunii: [45.762, 21.218],
};
const CATEGORIES = [['cinema', 'Cinema'], ['music', 'Music'], ['workshop', 'Workshop'], ['showcase', 'Showcase'], ['social', 'Social']];
const POST_CATEGORIES = [['neighbourhood', 'Local'], ['help', 'Help'], ['lost_pets', 'Lost pets'], ['buy_sell', 'Buy and sell'], ['cultural', 'Culture']];

const openComments = new Set(); // posts whose comments are showing (kept across refreshes)

const ago = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(mins)) return '';
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const eventRows = (events, canAct) => events.map((e) => row({
  art: art('events', 52), title: esc(e.title),
  detail: `${esc((e.description || '').slice(0, 110))}<br><span class="muted">${esc(e.locationName || e.location || CITY.name)} · ${esc(when(e.dateTime || e.date))}${e.attendeeCount ? ` · ${e.attendeeCount} going` : ''}</span>`,
  side: `<div style="display:grid;gap:6px;justify-items:end">${e.isFree ? '<span class="tag mint">Free</span>' : `<span class="tag">${esc(e.priceAmount ?? '')} RON</span>`}
    <span><button class="pill" data-map-event="${esc(e.id)}">On the map</button>${canAct ? ` <button class="pill on" data-rsvp="${esc(e.id)}">Get a ticket</button>` : ''}</span></div>`,
})).join('') || '<div class="empty">No events yet.</div>';

const postBlock = (p, canAct) => `
  <div class="post">
    <div class="row" style="border-bottom:0;padding-bottom:6px;align-items:flex-start">
      <div class="art">${art('forum', 52)}</div>
      <div class="body">
        <div class="title">${esc(p.title)}</div>
        <div class="detail">${esc(p.content)}</div>
        <div class="detail">${esc(p.authorName)} · ${esc(p.neighbourhood)} · ${esc(ago(p.createdAt))}</div>
      </div>
    </div>
    <div class="post-actions">
      ${canAct ? `<button class="pill ${p.viewerUpvoted ? 'on' : ''}" data-upvote="${esc(p.id)}" aria-pressed="${!!p.viewerUpvoted}">Upvote · ${p.upvotes || 0}</button>` : `<span class="muted">${p.upvotes || 0} upvotes</span>`}
      <button class="pill" data-togglec="${esc(p.id)}">${p.commentsCount || 0} ${p.commentsCount === 1 ? 'comment' : 'comments'}</button>
      ${canAct ? `<button class="pill" data-report="${esc(p.id)}" ${p.viewerReported ? 'disabled' : ''}>${p.viewerReported ? 'Reported' : 'Report'}</button>` : ''}
    </div>
    ${openComments.has(p.id) ? `
      <div class="comments">
        ${(p.comments || []).map((c) => `<div class="comment"><b>${esc(c.authorName)}</b> <span class="muted">${esc(ago(c.createdAt))}</span><div>${esc(c.content)}</div></div>`).join('') || '<div class="muted" style="padding:6px 0">No comments yet.</div>'}
        ${canAct ? `<form class="row-inline" data-comment-form="${esc(p.id)}"><label class="field"><span>Write a comment</span><input name="content" maxlength="1000" autocomplete="off" required></label><button class="btn btn-ink btn-md" type="submit">Send</button></form>` : ''}
      </div>` : ''}
  </div>`;

const buddyRows = (buddies) => buddies.map((b) => row({
  art: art('buddy', 52),
  title: esc(`${b.userName || 'Someone'} is going to ${b.eventTitle || 'an event'}`),
  detail: esc((b.bio || b.description || '').slice(0, 120)) + (b.interests?.length ? `<br><span class="muted">${esc(b.interests.map((i) => `#${i}`).join(' '))}</span>` : ''),
})).join('') || '<div class="empty">No requests yet.</div>';

export async function render(ctx) {
  const [events, posts, buddies] = await Promise.all([fetchEvents(), fetchForumPosts(), fetchBuddyRequests()]);
  const act = ctx.loggedIn;
  const feed = `<div class="cols section">
      <div>
        <div class="section-head"><h2>Events (${events.length})</h2>${act ? '<button class="btn btn-secondary btn-md" id="hostEventBtn">Host an event</button>' : ''}</div>
        <div class="list">${eventRows(events, act)}</div>
      </div>
      <div>
        <div class="section-head"><h2>Forum</h2>${act ? '<button class="btn btn-secondary btn-md" id="newPostBtn">New post</button>' : ''}</div>
        <div class="list">${posts.slice(0, 8).map((p) => postBlock(p, act)).join('') || '<div class="empty">No posts yet.</div>'}</div>
        <div class="section"><div class="section-head"><h2>People to go with</h2>${act ? '<button class="btn btn-secondary btn-md" id="buddyBtn">Find company</button>' : ''}</div>
        <div class="list">${buddyRows(buddies.slice(0, 5))}</div></div>
      </div>
    </div>`;
  const wallet = `<div class="section"><div class="section-head"><h2>Wallet</h2></div>
    <div class="list">${row({ art: art('wallet', 52), title: 'Tickets and badges on Solana devnet', detail: 'A ticket you get here is kept in your wallet in the app. Open the app to scan it at the door.' })}</div></div>`;
  return `<div class="page">
    <h1 class="page-title">Community</h1>
    <p class="page-sub">Events, neighbours and people to go with.</p>
    ${act
      ? feed + wallet
      : `<div class="locked" style="margin-top:32px"><div class="blurred">${feed}</div>
          <div class="door"><div><h3>Join your neighbours</h3><p>Log in to read the forum, reply, find someone to go to an event with, and get tickets.</p><button class="btn btn-primary" data-login>Log in</button></div></div></div>`}
  </div>`;
}

const select = (id, label, options, value) => `<label class="field"><span>${label}</span><select id="${id}">${options.map(([v, l]) => `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
const input = (id, label, attrs = '') => `<label class="field"><span>${label}</span><input id="${id}" ${attrs}></label>`;

/** A form in a dialog. `onSubmit` returns after the work is done; throwing shows the message inside the dialog. */
function openForm({ title, lead, body, submitLabel, onSubmit }) {
  const host = document.getElementById('modalContainer');
  const close = () => { host.innerHTML = ''; };
  host.innerHTML = `<div class="scrim" id="formBackdrop"><div class="dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <h2>${esc(title)}</h2>${lead ? `<p class="lead">${esc(lead)}</p>` : '<div style="height:14px"></div>'}
    <form class="stack" id="dialogForm">${body}<p class="error" id="formError" role="alert" hidden></p>
      <button class="btn btn-primary btn-block" type="submit" id="formSubmit">${esc(submitLabel)}</button>
      <button class="btn btn-text btn-block" type="button" id="formCancel">Cancel</button></form></div></div>`;
  document.getElementById('formCancel').addEventListener('click', close);
  document.getElementById('formBackdrop').addEventListener('click', (e) => { if (e.target.id === 'formBackdrop') close(); });
  document.getElementById('dialogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('formSubmit');
    btn.disabled = true;
    try {
      await onSubmit();
      close();
    } catch (err) {
      const box = document.getElementById('formError');
      box.textContent = err.message;
      box.hidden = false;
      btn.disabled = false;
    }
  });
  document.querySelector('#dialogForm input, #dialogForm select')?.focus();
}

const refresh = () => window.dispatchEvent(new Event('hop-refresh'));

export function mount(ctx, { showToast } = {}) {
  if (!ctx.loggedIn) return () => {};
  const me = ctx.user;
  const root = document.getElementById('mainContent');
  const run = async (work, done) => {
    try {
      await work();
      if (done) showToast?.(done);
      refresh();
    } catch (err) {
      showToast?.(err.message);
    }
  };

  root.querySelectorAll('[data-map-event]').forEach((b) => b.addEventListener('click', () => { location.hash = `#/map/evt-${b.dataset.mapEvent}`; }));
  root.querySelectorAll('[data-rsvp]').forEach((b) => b.addEventListener('click', () => run(() => hubPost(`/v1/m/events/${encodeURIComponent(b.dataset.rsvp)}/rsvp`, { userName: me.name }), 'You have a ticket. It is in your wallet in the app.')));
  root.querySelectorAll('[data-upvote]').forEach((b) => b.addEventListener('click', () => run(() => hubPost(`/v1/m/forum/${encodeURIComponent(b.dataset.upvote)}/upvote`))));
  root.querySelectorAll('[data-report]').forEach((b) => b.addEventListener('click', () => run(() => hubPost(`/v1/m/forum/${encodeURIComponent(b.dataset.report)}/report`, { reason: 'inappropriate' }), 'Thanks. A moderator will look at it.')));
  root.querySelectorAll('[data-togglec]').forEach((b) => b.addEventListener('click', () => { const id = b.dataset.togglec; openComments.has(id) ? openComments.delete(id) : openComments.add(id); refresh(); }));
  root.querySelectorAll('[data-comment-form]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    run(() => hubPost(`/v1/m/forum/${encodeURIComponent(f.dataset.commentForm)}/comments`, { content: new FormData(f).get('content') }));
  }));

  document.getElementById('newPostBtn')?.addEventListener('click', () => openForm({
    title: 'New post', lead: 'Share something with your neighbours.', submitLabel: 'Publish',
    body: select('pCategory', 'What is it about?', POST_CATEGORIES, 'neighbourhood') + select('pArea', 'Where', Object.keys(AREAS).map((a) => [a, a]), 'Cetate')
      + input('pTitle', 'Title', 'maxlength="120" required') + `<label class="field"><span>Details</span><textarea id="pContent" rows="4" maxlength="2000" required></textarea></label>`,
    onSubmit: async () => {
      await hubPost('/v1/m/forum', { category: document.getElementById('pCategory').value, neighbourhood: document.getElementById('pArea').value, title: document.getElementById('pTitle').value, content: document.getElementById('pContent').value });
      showToast?.('Posted.');
      refresh();
    },
  }));

  document.getElementById('hostEventBtn')?.addEventListener('click', () => openForm({
    title: 'Host an event', lead: 'People find it on the map at the place you name.', submitLabel: 'Publish event',
    body: input('eTitle', 'Title', 'maxlength="100" required') + select('eCategory', 'Type', CATEGORIES, 'social')
      + input('eVenue', 'Where is it? (venue or address)', 'maxlength="120" required') + select('eArea', 'Neighbourhood', Object.keys(AREAS).map((a) => [a, a]), 'Cetate')
      + input('eWhen', 'When', 'type="datetime-local" required') + `<label class="field"><span>About</span><textarea id="eDesc" rows="3" maxlength="600"></textarea></label>`,
    onSubmit: async () => {
      const venue = document.getElementById('eVenue').value.trim();
      const area = document.getElementById('eArea').value;
      // the event is tied to the place that holds it: the venue is looked up on the map, with the neighbourhood's middle as the fallback
      let [lat, lng] = AREAS[area];
      try {
        const found = await hubGet(`/v1/core/geocode?q=${encodeURIComponent(`${venue}, ${area}, ${CITY.name}`)}`);
        if (found.found) [lat, lng] = [found.latitude, found.longitude];
      } catch { /* keep the neighbourhood's middle */ }
      await hubPost('/v1/m/events', {
        title: document.getElementById('eTitle').value, category: document.getElementById('eCategory').value, locationName: venue, address: venue, neighbourhood: area,
        latitude: lat, longitude: lng, dateTime: new Date(document.getElementById('eWhen').value).toISOString(), description: document.getElementById('eDesc').value || 'Join us.', organizerName: me.name, isFree: true,
      });
      showToast?.('Event published. It is on the map.');
      refresh();
    },
  }));

  document.getElementById('buddyBtn')?.addEventListener('click', async () => {
    const events = await fetchEvents();
    openForm({
      title: 'Find company', lead: 'Tell others which event you are going to.', submitLabel: 'Post request',
      body: select('bEvent', 'Which event?', events.map((e) => [e.id, e.title]), events[0]?.id) + `<label class="field"><span>About you</span><textarea id="bBio" rows="3" maxlength="300"></textarea></label>` + input('bInterests', 'Interests, separated by commas', 'maxlength="100"'),
      onSubmit: async () => {
        const ev = events.find((e) => e.id === document.getElementById('bEvent').value);
        await hubPost('/v1/m/buddy', { eventId: ev.id, eventTitle: ev.title, userName: me.name, bio: document.getElementById('bBio').value, interests: document.getElementById('bInterests').value.split(',').map((s) => s.trim()).filter(Boolean) });
        showToast?.('Request posted.');
        refresh();
      },
    });
  });
  return () => {};
}
