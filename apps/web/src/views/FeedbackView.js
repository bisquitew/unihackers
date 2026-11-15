import { hubGet, hubPost } from '../api.js';
import { art, esc } from '../ui.js';

const WORDS = ['Tap a star', 'Needs work', 'Not great', 'It is okay', 'Good', 'Loving it'];
const PARTS = [['', 'The app in general'], ['m01-events', 'Events'], ['m08-forum', 'Forum'], ['m07-buddy', 'Buddies'], ['m09-wallet', 'Wallet'], ['parkie', 'Parking'], ['m04-utilities', 'Outages'], ['m05-transit', 'Transit'], ['m10-assistant', 'Assistant'], ['map', 'Map']];

/** Feedback: a rating and a message for the team, and the list of what changed because of it. */
export async function render(ctx) {
  return `<div class="page wide">
    <h1 class="page-title">Send feedback</h1>
    <p class="page-sub">We are building this app during the hackathon, with your feedback. It takes a minute.</p>
    <div class="cols section">
      <div>
        ${ctx.loggedIn ? `
        <form class="stack" id="fbForm">
          <div><div class="muted" style="font-size:13px;font-weight:600;margin-bottom:8px">How is the app?</div>
            <div class="stars" id="fbStars" role="group" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-r="${n}" aria-label="${n} of 5">★</button>`).join('')}</div>
            <div class="muted" id="fbWord" style="margin-top:6px">${WORDS[0]}</div></div>
          <label class="field"><span>About which part?</span><select id="fbPart">${PARTS.map(([id, l]) => `<option value="${id}">${l}</option>`).join('')}</select></label>
          <label class="field"><span>Tell us more</span><textarea id="fbText" rows="4" maxlength="1000" placeholder="What worked, what did not, what is missing?"></textarea></label>
          <div><button class="btn btn-primary" type="submit" id="fbSend">Send feedback</button></div>
          <div class="result" id="fbResult" hidden aria-live="polite"></div>
        </form>` : `<div class="door"><div><h3>Log in to send feedback</h3><p>It helps us know who to thank, and keeps spam out.</p><button class="btn btn-primary" data-login>Log in</button></div></div>`}
      </div>
      <div>
        <div class="section-head"><h2>What we changed</h2></div>
        <p class="muted" style="font-size:14px;margin-bottom:8px">Every version built during the hackathon, and the feedback that led to it.</p>
        <div class="list" id="fbLog"><div class="empty">Loading…</div></div>
      </div>
    </div>
  </div>`;
}

export function mount(ctx) {
  const $ = (id) => document.getElementById(id);
  let version = 'web';
  hubGet('/v1/m/feedback/changelog').then((r) => {
    const log = (r.changelog || []).slice().reverse();
    if (r.changelog?.length) version = r.changelog[r.changelog.length - 1].version;
    $('fbLog').innerHTML = log.map((c) => `<div class="row" style="align-items:flex-start"><div class="art">${art('feedback', 44)}</div><div class="body"><div class="title">${esc(c.version)}: ${esc(c.changed)}</div>${(c.becauseOf || []).length ? `<div class="detail">Because you told us: ${esc(c.becauseOf.map((b) => b.summary).join('; '))}</div>` : ''}</div></div>`).join('') || '<div class="empty">Nothing yet.</div>';
  }).catch(() => { $('fbLog').innerHTML = '<div class="empty">Could not load the list.</div>'; });

  if (!ctx.loggedIn) return;
  let rating = 0;
  $('fbStars').querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
    rating = Number(b.dataset.r);
    $('fbStars').querySelectorAll('[data-r]').forEach((x) => x.classList.toggle('on', Number(x.dataset.r) <= rating));
    $('fbWord').textContent = WORDS[rating];
  }));
  $('fbForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = $('fbResult');
    out.hidden = false;
    if (!rating) { out.innerHTML = '<b class="bad">Tap a star first.</b>'; return; }
    $('fbSend').disabled = true;
    try {
      await hubPost('/v1/m/feedback', { rating, moduleId: $('fbPart').value || null, text: $('fbText').value.trim(), appVersion: version });
      out.innerHTML = '<b class="ok">Thank you!</b><p style="margin-top:4px">We read every message. What we change because of you shows up in the list of changes.</p>';
      $('fbForm').reset();
    } catch (err) {
      out.innerHTML = `<b class="bad">Could not send. Try again.</b><p style="margin-top:4px">${esc(err.message)}</p>`;
    } finally {
      $('fbSend').disabled = false;
    }
  });
}
