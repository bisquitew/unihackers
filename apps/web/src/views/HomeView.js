import { fetchEvents, fetchForumPosts, fetchBuddyRequests, fetchLots, fetchOutages, fetchTransitLines } from '../api.js';
import { APP_LINK } from '../config.js';
import { art, cap, esc, qrSvg, row, statusText, when } from '../ui.js';
import { buildLayers, createMap } from '../mapEngine.js';
import { CITY } from '../city.js';

const alertRows = (outages, lines) => {
  const out = outages.slice(0, 3).map((o) => row({
    art: art('utilities', 52), title: esc(o.title),
    detail: esc(`${cap(o.provider)} · ${(o.affected_areas || []).join(', ')}`),
    side: statusText(o.status),
  }));
  const trans = lines.filter((l) => l.status !== 'normal').slice(0, 2).map((l) => row({
    art: art('transit', 52), title: `Line ${esc(l.line_number)}: ${esc(l.name)}`,
    detail: esc(l.detour_alert?.title || l.current_route_summary || ''), side: esc(statusText(l.status)),
  }));
  return [...out, ...trans].join('') || `<div class="empty">No active alerts. All quiet.</div>`;
};
const eventRows = (events) => events.slice(0, 4).map((e) => row({
  art: art('events', 52), title: esc(e.title),
  detail: esc(`${e.locationName || e.location || CITY.name} · ${when(e.dateTime || e.date)}`),
  side: e.isFree ? 'Free' : '',
})).join('') || `<div class="empty">No events this week.</div>`;
const lotRows = (lots) => [...lots].sort((a, b) => b.available_spots - a.available_spots).slice(0, 4).map((l) => row({
  num: l.available_spots, numTone: l.status_color === 'red' ? 'apricot' : 'mint', title: esc(l.name),
  detail: `of ${l.capacity} spots free`, meter: { pct: (l.available_spots / l.capacity) * 100, color: l.status_color === 'red' ? 'red' : l.status_color === 'yellow' ? 'yellow' : '' },
})).join('');
const communityRows = (posts, buddies) => [
  ...posts.slice(0, 3).map((p) => row({ art: art('forum', 52), title: esc(p.title), detail: esc((p.content || '').slice(0, 90)), side: `${p.likes || 0} likes` })),
  ...buddies.slice(0, 2).map((b) => row({ art: art('buddy', 52), title: esc(b.title || `${b.userName || 'Someone'} is looking for company`), detail: esc((b.description || b.bio || b.eventTitle || '').slice(0, 90)) })),
].join('');

export async function render(ctx) {
  const [outages, lines, events, lots, posts, buddies] = await Promise.all([
    fetchOutages(), fetchTransitLines(), fetchEvents(), fetchLots(), fetchForumPosts(), fetchBuddyRequests(),
  ]);
  const free = lots.reduce((a, l) => a + l.available_spots, 0);
  const rerouted = lines.filter((l) => l.status !== 'normal').length;
  const hour = new Date().getHours();
  const hello = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const head = ctx.loggedIn
    ? `<div class="greeting"><small>${hello}</small><h1>${esc(ctx.user.name.split(' ')[0])}, here is ${esc(CITY.name)} today.</h1></div>`
    : `<section class="hero">
        <div>
          <h1>Your city, in one place.</h1>
          <p>Live alerts, parking, events and your neighbours in ${esc(CITY.name)}. Look around for free, log in to join in.</p>
          <div class="actions"><button class="btn btn-primary" data-login>Log in</button><button class="btn btn-secondary" data-goto="map">Explore the map</button></div>
        </div>
        <div class="hero-map" id="heroMap"></div>
      </section>`;

  const qr = qrSvg(APP_LINK);
  const community = communityRows(posts, buddies);
  return `<div class="page">
    ${head}
    <div class="stats">
      <div class="stat"><b style="color:var(--apricot)">${outages.length}</b><span>Active outages</span></div>
      <div class="stat"><b style="color:var(--blue)">${rerouted}</b><span>Rerouted transit lines</span></div>
      <div class="stat"><b style="color:var(--mint)">${free}</b><span>Free parking spots</span></div>
      <div class="stat"><b>${events.length}</b><span>Events coming up</span></div>
    </div>

    <div class="cols section">
      <div>
        <div class="section-head"><h2>Right now</h2><button class="link" data-goto="alerts">All alerts</button></div>
        <div class="list">${alertRows(outages, lines)}</div>
        <div class="section"><div class="section-head"><h2>This week</h2><button class="link" data-goto="community">All events</button></div>
        <div class="list">${eventRows(events)}</div></div>
      </div>
      <div>
        <div class="section-head"><h2>Parking</h2><button class="link" data-goto="parkie">All lots</button></div>
        <div class="list">${lotRows(lots)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h2>From the community</h2>${ctx.loggedIn ? '<button class="link" data-goto="community">Open community</button>' : ''}</div>
      ${ctx.loggedIn
        ? `<div class="list">${community}</div>`
        : `<div class="locked"><div class="blurred list">${community}</div>
             <div class="door"><div><h3>Join the conversation</h3><p>Neighbours, events and people to go with. Log in to read and reply.</p><button class="btn btn-primary" data-login>Log in</button></div></div></div>`}
    </div>

    <section class="app-strip">
      <div><h2>Take hop with you</h2><p>Tickets, chats and live alerts are best in the app. Scan the code to open it on your phone.</p></div>
      ${qr ? `<div class="qr" role="img" aria-label="QR code to open the hop app">${qr}</div>` : ''}
    </section>
  </div>`;
}

export function mount(ctx, { lotsData }) {
  const holder = document.getElementById('heroMap');
  if (!holder) return () => {};
  const map = createMap(holder);
  Promise.all([fetchLots(), fetchOutages(), fetchEvents()]).then(([lots, outages, events]) => {
    const layers = buildLayers({ lots, outages, events });
    map.setPins(Object.values(layers).flatMap((l) => l.pins));
    map.overview();
  });
  return () => map.destroy();
}
