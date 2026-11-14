import { fetchBuddyRequests, fetchEvents, fetchForumPosts } from '../api.js';
import { art, esc, row, when } from '../ui.js';
import { CITY } from '../city.js';

const eventRows = (events) => events.map((e) => row({
  art: art('events', 52), title: esc(e.title),
  detail: `${esc((e.description || '').slice(0, 110))}<br><span class="muted">${esc(e.locationName || e.location || CITY.name)} · ${esc(when(e.dateTime || e.date))}</span>`,
  side: e.isFree ? '<span class="tag mint">Free</span>' : '',
})).join('') || '<div class="empty">No events yet.</div>';
const postRows = (posts) => posts.map((p) => row({ art: art('forum', 52), title: esc(p.title), detail: esc((p.content || '').slice(0, 140)), side: `${p.likes || 0} likes` })).join('') || '<div class="empty">No posts yet.</div>';
const buddyRows = (buddies) => buddies.map((b) => row({ art: art('buddy', 52), title: esc(b.title || `${b.userName || 'Someone'} is looking for company`), detail: esc((b.description || b.bio || b.eventTitle || '').slice(0, 120)) })).join('') || '<div class="empty">No requests yet.</div>';

export async function render(ctx) {
  const [events, posts, buddies] = await Promise.all([fetchEvents(), fetchForumPosts(), fetchBuddyRequests()]);
  const feed = `<div class="cols section">
      <div><div class="section-head"><h2>Events (${events.length})</h2></div><div class="list">${eventRows(events)}</div></div>
      <div>
        <div class="section-head"><h2>Forum</h2></div><div class="list">${postRows(posts.slice(0, 5))}</div>
        <div class="section"><div class="section-head"><h2>People to go with</h2></div><div class="list">${buddyRows(buddies.slice(0, 4))}</div></div>
      </div>
    </div>`;
  const wallet = `<div class="section"><div class="section-head"><h2>Wallet</h2></div>
    <div class="list">${row({ art: art('wallet', 52), title: 'Tickets and badges on Solana devnet', detail: 'Get a ticket for an event, keep it in your wallet and scan it at the door. Open the app to use it.' })}</div></div>`;
  return `<div class="page">
    <h1 class="page-title">Community</h1>
    <p class="page-sub">Events, neighbours and people to go with.</p>
    ${ctx.loggedIn
      ? feed + wallet
      : `<div class="locked" style="margin-top:32px"><div class="blurred">${feed}</div>
          <div class="door"><div><h3>Join your neighbours</h3><p>Log in to read the forum, reply, find someone to go to an event with, and get tickets.</p><button class="btn btn-primary" data-login>Log in</button></div></div></div>`}
  </div>`;
}
export const mount = () => () => {};
