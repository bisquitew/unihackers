import { checkAddressOutages, checkAreaProximity, checkTransitStop, fetchAreaAlerts, fetchOutages, fetchTransitLines } from '../api.js';
import { art, cap, esc, row, statusText } from '../ui.js';
import { dateLocale } from '../i18n.js';

const plain = (t = '') => String(t).replace(/^[^\p{L}\p{N}]+/u, '');
const hhmm = (iso) => new Date(iso).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' });

// What each kind of check asks for
const CHECKS = {
  zone: { label: 'Danger and works', ask: 'Street or neighbourhood', example: 'Circumvalațiunii', button: 'Check' },
  outage: { label: 'Outages', ask: 'Street or neighbourhood', example: 'Calea Șagului', button: 'Check' },
  transit: { label: 'Transit stop', ask: 'Stop name', example: 'Calea Bogdăneștilor', button: 'Check' },
};

/** Alerts: what is going on around the city, and a check for whether it affects a place. */
export async function render() {
  const [outages, lines, zones] = await Promise.all([fetchOutages(), fetchTransitLines(), fetchAreaAlerts({ status: 'active' })]);
  const detoured = lines.filter((l) => l.status && l.status !== 'normal');
  const total = zones.length + outages.length + detoured.length;

  const zoneRows = zones.map((z) => row({
    tag: 'a', attrs: `href="#/map?alert=${encodeURIComponent(z.id)}" aria-label="${esc(plain(z.title))}, show on the map"`,
    art: art('safety', 52), title: esc(plain(z.title)),
    detail: `${z.type === 'danger' ? 'Keep away from the area' : 'Works in progress'} · ${esc(z.radius_meters)} m around${(z.affected_neighbourhoods || []).length ? ` · ${esc(z.affected_neighbourhoods.join(', '))}` : ''}`,
    side: `<span class="tag ${z.type === 'danger' ? 'apricot' : 'blue'}">${esc(cap(z.severity || ''))}</span>`,
  })).join('');

  const outageRows = outages.map((o) => row({
    art: art('utilities', 52), title: esc(o.title),
    detail: `${esc(cap(o.provider))} · ${esc((o.affected_areas || []).join(', '))}${o.estimated_restore_time ? ` · Expected back about ${esc(hhmm(o.estimated_restore_time))}` : ''}`,
    side: `<span class="tag apricot">${esc(statusText(o.status || 'active'))}</span>`,
  })).join('');

  const transitRows = detoured.map((l) => row({
    art: art('transit', 52), title: `Line ${esc(l.line_number)}`,
    detail: esc(l.detour_alert?.title ? plain(l.detour_alert.title) : l.current_route_summary || l.name),
    side: `<span class="tag blue">${esc(statusText(l.status))}</span>`,
  })).join('');

  const group = (title, html, count) => (count ? `<div class="section"><div class="section-head"><h2>${title}</h2><span class="muted">${count}</span></div><div class="list">${html}</div></div>` : '');

  return `<div class="page wide">
    <h1 class="page-title">Alerts</h1>
    <p class="page-sub">What is going on around the city, and whether it affects you.</p>
    <div class="cols section">
      <div>
        ${total ? '' : '<div class="empty"><b>All quiet</b><br>No outages, danger zones or transit changes right now.</div>'}
        ${group('Danger and works', zoneRows, zones.length)}
        ${group('Outages', outageRows, outages.length)}
        ${group('Transit', transitRows, detoured.length)}
      </div>
      <aside class="checker" aria-label="Check a place">
        <div class="section-head"><h2>Does it affect me?</h2></div>
        <div class="segmented" role="tablist" aria-label="What to check" id="checkKind">
          ${Object.entries(CHECKS).map(([k, c], i) => `<button role="tab" data-kind="${k}" class="${i === 0 ? 'on' : ''}">${c.label}</button>`).join('')}
        </div>
        <form class="stack" id="checkForm" style="margin-top:16px">
          <label class="field"><span id="checkAsk">${CHECKS.zone.ask}</span><input id="checkInput" required autocomplete="off" placeholder="${esc(CHECKS.zone.example)}"></label>
          <div><button class="btn btn-primary" type="submit" id="checkBtn">Check</button></div>
        </form>
        <div class="verdict" id="checkResult" hidden aria-live="polite"></div>
      </aside>
    </div>
  </div>`;
}

export function mount() {
  const $ = (id) => document.getElementById(id);
  let kind = 'zone';
  const show = (tone, headline, lines = []) => {
    const out = $('checkResult');
    out.hidden = false;
    out.innerHTML = `<b class="${tone}">${esc(headline)}</b>${lines.map((l) => `<p>${l}</p>`).join('')}`;
  };

  document.querySelectorAll('#checkKind button').forEach((b) => b.addEventListener('click', () => {
    kind = b.dataset.kind;
    document.querySelectorAll('#checkKind button').forEach((x) => x.classList.toggle('on', x === b));
    $('checkAsk').textContent = CHECKS[kind].ask;
    $('checkInput').placeholder = CHECKS[kind].example;
    $('checkResult').hidden = true;
  }));

  $('checkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = $('checkInput').value.trim();
    if (!value) return;
    const btn = $('checkBtn');
    btn.disabled = true;
    try {
      if (kind === 'zone') {
        const res = await checkAreaProximity({ address: value });
        const inside = (res.matching_alerts || []).filter((m) => m.is_inside_radius);
        const ns = res.nearest_safe_place;
        const safeLine = ns ? `Nearest safe place: ${esc(ns.name)} (${esc({ hospital: 'hospital', police: 'police station', fire: 'fire station' }[ns.kind] || ns.kind)}), ${esc(ns.distance_meters)} m away. In an emergency call 112.` : '';
        if (res.error) show('bad', 'Could not check right now. Try again.');
        else if (inside.length) {
          const a = inside[0].alert;
          show(a.type === 'danger' ? 'warn' : 'info', a.type === 'danger' ? 'You are inside a danger zone.' : 'You are inside a works zone.', [
            `<a href="#/map?alert=${encodeURIComponent(a.id)}">${esc(plain(a.title))}</a> · ${esc(a.radius_meters)} m around`,
            esc(a.description),
            safeLine,
          ].filter(Boolean));
        } else {
          const near = (res.matching_alerts || [])[0];
          show('ok', 'You are outside every active zone.', [...(near ? [`Closest: ${esc(plain(near.alert.title))}, ${esc(near.distance_meters)} m away (it reaches ${esc(near.alert.radius_meters)} m).`] : []), safeLine].filter(Boolean));
        }
      } else if (kind === 'outage') {
        const res = await checkAddressOutages(value);
        if (!res) show('bad', 'Could not check right now. Try again.');
        else if (res.is_affected) show('warn', 'There is an outage here.', (res.active_outages || []).map((o) => `${esc(cap(o.provider))}: ${esc(o.title)}${o.estimated_restore_time ? `. Expected back about ${esc(hhmm(o.estimated_restore_time))}.` : ''}`));
        else show('ok', 'No outage here.', ['Heating, hot water and water are running.']);
      } else {
        const res = await checkTransitStop(value);
        if (!res) show('bad', 'Could not check right now. Try again.');
        else if (res.is_affected_by_detour) show('info', 'This stop is on a detour.', (res.active_alerts || []).map((a) => `Line ${esc(a.line_number)}: ${esc(statusText(a.status))}. ${esc(a.alternative_instructions || '')}`));
        else show('ok', 'Normal service.', ['No detours at this stop.']);
      }
    } finally {
      btn.disabled = false;
    }
  });
}
