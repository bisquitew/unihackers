import { logout } from '../auth.js';
import { hubGet } from '../api.js';
import { getLang, setLang } from '../i18n.js';
import { art, cap, esc, isDark, qrSvg, row, when } from '../ui.js';

const SECTIONS = [['overview', 'Overview'], ['wallet', 'Wallet'], ['settings', 'Settings']];
const THEME_KEY = 'hop_theme';
const PREFS_KEY = 'hop_notify';
const NOTIFY = [
  ['alerts', 'Safety and city alerts', 'Water, traffic and warnings near you'],
  ['events', 'Event reminders', 'Before an event you have a ticket for'],
  ['replies', 'Community replies', 'Answers to your posts and messages'],
];

const readPrefs = () => { try { return { alerts: true, events: true, replies: true, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch { return { alerts: true, events: true, replies: true }; } };
const themeSetting = () => { try { return localStorage.getItem(THEME_KEY) || 'system'; } catch { return 'system'; } };

/** Profile: who you are, your tickets and badges, and the settings (language, appearance, notifications). */
export async function render(ctx) {
  if (!ctx.loggedIn) {
    return `<div class="page"><div class="door"><div><h1>Your profile</h1><p>Log in to see your tickets and badges, and to change your settings.</p><button class="btn btn-primary" data-login>Log in</button></div></div></div>`;
  }
  return `<div class="page">
    <h1 class="page-title">Profile</h1>
    <div class="segmented" role="tablist" aria-label="Profile sections" id="profileTabs" style="margin-top:20px">
      ${SECTIONS.map(([id, label], i) => `<button role="tab" data-sec="${id}" class="${i === 0 ? 'on' : ''}">${label}</button>`).join('')}
    </div>
    <div id="profileBody" style="margin-top:28px"></div>
  </div>`;
}

let profileOpen = 'overview';

export function mount(ctx) {
  if (!ctx.loggedIn) return;
  const body = document.getElementById('profileBody');
  const u = ctx.user;
  let open = profileOpen; // kept across redraws, so changing the language does not send you back to Overview

  const overview = () => `
    <div class="list">
      ${row({ art: art('home', 52), title: esc(u.name), detail: `${esc(u.email)} · ${esc(cap(u.role))}` })}
      ${u.neighbourhood ? row({ title: 'Your neighbourhood', detail: esc(u.neighbourhood) }) : ''}
    </div>
    <div class="section"><div class="section-head"><h2>Your things</h2></div>
      <div class="list">
        ${row({ tag: 'button', attrs: 'data-sec-go="wallet"', art: art('wallet', 52), title: 'Tickets and badges', detail: 'Your tickets, ready to scan at the door.' })}
        ${row({ tag: 'a', attrs: 'href="#/report"', art: art('safety', 52), title: 'Report a problem', detail: 'Smell, lighting, noise, places that feel unsafe.' })}
      </div></div>
    <div class="section"><div class="section-head"><h2>Help</h2></div>
      <div class="list">
        ${row({ tag: 'a', attrs: 'href="#/info"', art: art('visitorInfo', 52), title: 'Visitor info', detail: 'Good to know when you arrive in the city.' })}
        ${row({ tag: 'a', attrs: 'href="#/feedback"', art: art('feedback', 52), title: 'Send feedback', detail: 'Tell the team what to fix.' })}
      </div></div>
    <div class="section"><button class="btn btn-secondary" id="signOut">Sign out</button></div>`;

  const wallet = async () => {
    body.innerHTML = '<p class="muted">Loading…</p>';
    let data = { tickets: [], poaps: [] };
    try { data = await hubGet('/v1/m/solana/tickets/mine'); } catch { /* shows as empty */ }
    const tickets = data.tickets || [];
    const badges = data.poaps || [];
    body.innerHTML = `
      <p class="muted">${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}, ${badges.length} ${badges.length === 1 ? 'badge' : 'badges'}</p>
      <div class="section"><div class="section-head"><h2>Tickets</h2></div>
        <div class="list">${tickets.map((t, i) => row({
          tag: 'button', attrs: `data-ticket="${i}"`, art: art('wallet', 52), title: esc(t.eventTitle),
          detail: t.isCheckedIn ? 'Used at the door' : 'Valid for entry',
          side: `<span class="tag ${t.isCheckedIn ? '' : 'mint'}">${t.isCheckedIn ? 'Used' : 'Valid'}</span>`,
        })).join('') || `<div class="empty"><b>No tickets yet</b><br>Get a ticket from an event and it will show up here, ready to scan at the door.<br><a class="btn btn-secondary btn-md" href="#/community" style="margin-top:14px">Browse events</a></div>`}</div>
        <div id="ticketDetail"></div>
      </div>
      <div class="section"><div class="section-head"><h2>Badges</h2></div>
        <div class="list">${badges.map((b) => row({ art: art('events', 52), title: esc(b.eventTitle), detail: `You were at this event · ${esc(when(b.issuedAt))}` })).join('') || '<div class="empty"><b>No badges yet</b><br>You earn a badge when your ticket is scanned at the door. It proves you were there.</div>'}</div>
      </div>
      <p class="muted section" style="font-size:14px">Your tickets and badges are recorded on Solana devnet, a practice network. The coins here are free test coins with no real value.</p>`;
    body.querySelectorAll('[data-ticket]').forEach((b) => b.addEventListener('click', () => {
      const t = tickets[Number(b.dataset.ticket)];
      document.getElementById('ticketDetail').innerHTML = `
        <div class="ticket-card">
          <div class="qr" aria-label="Ticket code">${qrSvg(t.qrPayload || t.ticketId)}</div>
          <div><h3>${esc(t.eventTitle)}</h3>
            <p class="muted">${t.isCheckedIn ? 'Used at the door.' : 'Valid for entry. Show this code at the door.'}</p>
            ${t.explorerUrl ? `<a href="${esc(t.explorerUrl)}" target="_blank" rel="noopener">View on Solana Explorer</a>` : ''}</div>
        </div>`;
    }));
  };

  const settings = () => {
    const prefs = readPrefs();
    const theme = themeSetting();
    body.innerHTML = `
      <div class="section" style="margin-top:0"><div class="section-head"><h2>Language</h2></div>
        <div class="segmented" id="langSeg" role="group" aria-label="Language">
          <button data-l="en" class="${getLang() === 'en' ? 'on' : ''}">English</button><button data-l="ro" class="${getLang() === 'ro' ? 'on' : ''}">Română</button>
        </div></div>
      <div class="section"><div class="section-head"><h2>Appearance</h2></div>
        <div class="segmented" id="themeSeg" role="group" aria-label="Appearance">
          ${[['light', 'Light'], ['dark', 'Dark'], ['system', 'System']].map(([k, l]) => `<button data-t="${k}" class="${theme === k ? 'on' : ''}">${l}</button>`).join('')}
        </div>
        <p class="muted" style="margin-top:8px;font-size:14px">System follows your computer's setting.</p></div>
      <div class="section"><div class="section-head"><h2>Alerts</h2></div>
        <div class="list">${NOTIFY.map(([k, title, detail]) => row({ title, detail, side: `<label class="switch"><input type="checkbox" data-n="${k}" ${prefs[k] ? 'checked' : ''} aria-label="${esc(title)}"><i></i></label>` })).join('')}</div></div>
      <div class="section"><div class="section-head"><h2>Account</h2></div>
        <div class="list">${row({ title: 'Your account', detail: `${esc(u.email)} · ${esc(cap(u.role))}` })}</div>
        <div style="margin-top:14px"><button class="btn btn-secondary" id="signOut">Sign out</button></div></div>`;
    body.querySelectorAll('#langSeg [data-l]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.l); window.dispatchEvent(new Event('hop-theme')); draw(); }));
    body.querySelectorAll('#themeSeg [data-t]').forEach((b) => b.addEventListener('click', () => {
      try { localStorage.setItem(THEME_KEY, b.dataset.t); } catch { /* ignore */ }
      window.dispatchEvent(new Event('hop-set-theme'));
      draw();
    }));
    body.querySelectorAll('[data-n]').forEach((el) => el.addEventListener('change', () => {
      const p = readPrefs();
      p[el.dataset.n] = el.checked;
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
    }));
  };

  const draw = () => {
    profileOpen = open;
    document.querySelectorAll('#profileTabs [data-sec]').forEach((b) => b.classList.toggle('on', b.dataset.sec === open));
    if (open === 'wallet') wallet();
    else {
      body.innerHTML = open === 'overview' ? overview() : '';
      if (open === 'settings') settings();
    }
    body.querySelectorAll('[data-sec-go]').forEach((b) => b.addEventListener('click', () => { open = b.dataset.secGo; draw(); }));
    document.getElementById('signOut')?.addEventListener('click', async () => { await logout(); location.hash = '#/home'; });
  };
  document.querySelectorAll('#profileTabs [data-sec]').forEach((b) => b.addEventListener('click', () => { open = b.dataset.sec; draw(); }));
  draw();
  void isDark;
}
