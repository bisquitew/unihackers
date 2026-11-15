import { getCurrentToken, hasMfa, switchToken } from '../auth.js';
import {
  approveReportedPost, createAreaAlert, createOutage, fetchAreaAlerts, fetchAuditLogs, fetchDashboardOverview, fetchLots,
  fetchOutages, fetchReportedPosts, fetchTigerStatus, removeReportedPost, saveLotPlots,
  parseNoticePhoto, confirmNotice, hubGet, askAnalyst, fetchIncidents,
} from '../api.js';
import { getLang } from '../i18n.js';
import { createLotEditor } from '../components/ParkieLotEditor.js';
import { bars, columns, donut, hueOf, moduleLabel } from '../components/charts.js';
import { EXAMPLE_ANALYTICS } from '../components/analyticsExample.js';
import { art, cap, esc, row, statusText } from '../ui.js';

// The staff dashboard is one page with a side menu. Each entry is a section; only the open one is on screen.
const SECTIONS = [
  { group: 'City', items: [['overview', 'Overview'], ['analytics', 'Analytics'], ['incidents', 'Incident radar'], ['analyst', 'Ask the data'], ['alerts', 'Alerts'], ['notice', 'Scan a notice']] },
  { group: 'Services', items: [['parking', 'Parking cameras']] },
  { group: 'Community', items: [['moderation', 'Moderation']] },
  { group: 'System', items: [['security', 'Security log'], ['database', 'Database']] },
];

// Neighbourhoods a danger or works zone can be centred on
const AREAS = [
  ['Circumvalațiunii', 45.762, 21.218], ['Cetate', 45.7537, 21.2272], ['Complex Studențesc', 45.748, 21.241], ['Mehala', 45.768, 21.202],
  ['Fabric', 45.758, 21.251], ['Iosefin', 45.745, 21.205], ['Elisabetin', 45.7412, 21.2261],
];
// What is next to what, for the "who will be told" preview. The server works out the real list when the alert is published.
const NEXT_TO = {
  Circumvalațiunii: ['Cetate', 'Mehala'], Cetate: ['Circumvalațiunii', 'Fabric', 'Iosefin'], 'Complex Studențesc': ['Elisabetin', 'Fabric'],
  Mehala: ['Circumvalațiunii'], Fabric: ['Cetate', 'Complex Studențesc'], Iosefin: ['Cetate', 'Elisabetin'], Elisabetin: ['Iosefin', 'Complex Studențesc'],
};

const kpi = (value, label, color = '') => `<div class="stat"><b ${color ? `style="color:var(--${color})"` : ''}>${esc(value)}</b><span>${esc(label)}</span></div>`;
const plain = (t = '') => String(t).replace(/^[^\p{L}\p{N}]+/u, '');

/** The staff dashboard, for city staff on the website. */
export async function render(ctx) {
  return `<div class="page wide">
    <div class="dash">
      <aside class="dash-nav" aria-label="Dashboard sections">
        <div class="who"><strong>${esc(ctx.user.name)}</strong><span class="muted">City staff</span></div>
        ${SECTIONS.map((g) => `<div class="group"><span>${g.group}</span>${g.items.map(([id, label]) => `<button data-section="${id}">${label}</button>`).join('')}</div>`).join('')}
      </aside>
      <div class="dash-body" id="dashBody"><p class="muted">Loading…</p></div>
    </div>
  </div>`;
}

export function mount(ctx, { showToast } = {}) {
  const body = document.getElementById('dashBody');
  const nav = document.querySelectorAll('.dash-nav [data-section]');
  let open = 'overview';
  let token = 0;
  let sectionCleanup = () => {};

  const draw = async () => {
    const mine = ++token;
    sectionCleanup();
    sectionCleanup = () => {};
    nav.forEach((b) => b.classList.toggle('active', b.dataset.section === open));
    body.innerHTML = '<p class="muted">Loading…</p>';
    const section = { overview, analytics, incidents, analyst, alerts, notice, parking, moderation, security, database }[open];
    let html;
    try {
      html = await section.render(ctx);
    } catch (err) {
      console.error(err);
      html = `<div class="empty">Could not load this section. ${esc(err.message)}</div>`;
    }
    if (mine !== token) return;
    body.innerHTML = html;
    const cleanup = section.mount?.(ctx, showToast, draw);
    if (typeof cleanup === 'function') sectionCleanup = cleanup;
  };
  nav.forEach((b) => b.addEventListener('click', () => { open = b.dataset.section; draw(); }));
  draw();
  return () => { token += 1; sectionCleanup(); };
}

/* ---------------------------------------------------------------- Overview */
const overview = {
  async render() {
    const o = await fetchDashboardOverview();
    const k = o?.kpis;
    if (!k) return '<h1 class="page-title">Overview</h1><div class="empty">The city figures are not available right now.</div>';
    const env = k.environment || {};
    const infra = k.infrastructure_alerts || {};
    const reports = k.community_reports || {};
    const weekReports = (reports.smell?.last_7_days || 0) + (reports.safety?.last_7_days || 0);
    return `
      <h1 class="page-title">Overview</h1>
      <p class="page-sub">How the city is doing right now.</p>
      <div class="stats">
        ${kpi(k.parking.total_available_spots, 'Free parking spots', 'mint')}
        ${kpi(infra.active_utility_outages ?? 0, 'Active outages', 'apricot')}
        ${kpi(infra.active_transit_detours ?? 0, 'Transit detours', 'blue')}
        ${kpi(weekReports, 'Resident reports this week')}
      </div>
      <div class="cols even section">
        <div>
          <div class="section-head"><h2>Most crowded parking</h2></div>
          <div class="list">${(k.parking.most_congested_lots || []).map((l) => row({
            num: l.available_spots, numTone: l.status_color === 'red' ? 'apricot' : 'mint', title: esc(l.name), detail: `of ${l.capacity} spots free`,
            meter: { pct: (l.available_spots / l.capacity) * 100, color: l.status_color === 'red' ? 'red' : l.status_color === 'yellow' ? 'yellow' : '' },
          })).join('') || '<div class="empty">No lots yet.</div>'}</div>
        </div>
        <div>
          <div class="section-head"><h2>Air and noise</h2></div>
          <div class="list">
            ${row({ num: env.air_quality_avg_pm25 ?? '–', title: 'Air quality (PM2.5)', detail: `${esc(statusText(env.air_quality_status || ''))} · average across ${esc(env.sensor_areas ?? '?')} sensor areas` })}
            ${row({ num: env.avg_noise_db ?? '–', title: 'Noise (dB)', detail: 'Average across the monitored neighbourhoods' })}
          </div>
        </div>
      </div>`;
  },
};

/* ------------------------------------------------------------------ Alerts */
const alerts = {
  async render() {
    const [outages, zones] = await Promise.all([fetchOutages(), fetchAreaAlerts({ status: 'active' })]);
    const mfa = hasMfa();
    return `
      <h1 class="page-title">Alerts</h1>
      <p class="page-sub">Tell residents about an outage, a danger or works. It shows on the map and in their alerts.</p>
      <div class="cols section">
        <div>
          <div class="section-head"><h2>New alert</h2></div>
          <div class="segmented" role="tablist" aria-label="Kind of alert" id="alertKind">
            <button class="on" data-kind="danger" role="tab">Danger zone</button>
            <button data-kind="construction" role="tab">Works zone</button>
            <button data-kind="outage" role="tab">Outage</button>
          </div>
          <form class="stack" id="alertForm" style="margin-top:18px">
            <label class="field"><span>Title</span><input id="aTitle" maxlength="120" required></label>
            <label class="field"><span id="aDescLabel">What residents should do</span><textarea id="aDesc" rows="3" maxlength="600" required></textarea></label>

            <div id="zoneFields" class="stack">
              <div class="two">
                <label class="field"><span>Centred on</span><select id="aArea">${AREAS.map(([n, lat, lng]) => `<option value="${esc(n)}" data-lat="${lat}" data-lng="${lng}">${esc(n)}</option>`).join('')}</select></label>
                <label class="field"><span>How serious</span><select id="aSeverity"><option value="critical">Critical: keep away now</option><option value="high" selected>High: big impact</option><option value="medium">Medium: some impact</option></select></label>
              </div>
              <div class="field"><div class="between"><span>Radius</span><b id="aRadiusLabel">700 m</b></div><input type="range" id="aRadius" aria-label="Radius in metres" min="150" max="2500" step="50" value="700" style="width:100%"><span id="aRadiusHint"></span></div>
              <div class="notice" id="aWho"></div>
            </div>

            <div id="outageFields" class="stack" hidden>
              <div class="two">
                <label class="field"><span>Provider</span><select id="oProvider"><option value="colterm">Colterm (heating, hot water)</option><option value="aquatim">Aquatim (water, sewage)</option></select></label>
                <label class="field"><span>Affected areas, separated by commas</span><input id="oAreas" placeholder="Circumvalațiunii, Mehala"></label>
              </div>
              <div class="mfa ${mfa ? 'ok' : 'warn'}"><span>${mfa ? 'Second check done for this session.' : 'Publishing an outage needs a second check first.'}</span>${mfa ? '' : '<button class="btn btn-secondary btn-sm" type="button" id="upgradeMfa">Verify with passkey</button>'}</div>
            </div>

            <div><button class="btn btn-primary" type="submit" id="aSubmit">Publish alert</button></div>
            <div class="result" id="aResult" hidden></div>
          </form>
        </div>

        <div>
          <div class="section-head"><h2>Active now</h2></div>
          <div class="list">
            ${zones.map((z) => row({
              art: art('safety', 52), title: esc(plain(z.title)),
              detail: `${z.type === 'danger' ? 'Danger zone' : 'Works zone'} · ${z.radius_meters} m · ${esc((z.affected_neighbourhoods || []).join(', '))}`,
              side: `<span class="tag ${z.type === 'danger' ? 'apricot' : 'blue'}">${esc(cap(z.severity || ''))}</span>`,
            })).join('')}
            ${outages.map((o) => row({
              art: art('utilities', 52), title: esc(o.title),
              detail: `Outage · ${esc(cap(o.provider))} · ${esc((o.affected_areas || []).join(', '))}`,
              side: `<span class="tag apricot">${esc(statusText(o.status || 'active'))}</span>`,
            })).join('')}
            ${zones.length + outages.length === 0 ? '<div class="empty">No active alerts.</div>' : ''}
          </div>
        </div>
      </div>`;
  },
  mount(ctx, showToast, redraw) {
    let kind = 'danger';
    const $ = (id) => document.getElementById(id);
    const setKind = (k) => {
      kind = k;
      document.querySelectorAll('#alertKind button').forEach((b) => b.classList.toggle('on', b.dataset.kind === k));
      $('zoneFields').hidden = k === 'outage';
      $('outageFields').hidden = k !== 'outage';
      $('aDescLabel').textContent = k === 'danger' ? 'What residents should do' : k === 'construction' ? 'What is happening and who is affected' : 'What is affected and when it should be back';
    };
    document.querySelectorAll('#alertKind button').forEach((b) => b.addEventListener('click', () => setKind(b.dataset.kind)));

    const preview = () => {
      const radius = Number($('aRadius').value);
      const area = $('aArea').value;
      $('aRadiusLabel').textContent = `${radius} m`;
      $('aRadiusHint').textContent = `About ${Math.max(1, Math.round(radius / 80))} min on foot from the centre to the edge.`;
      const near = radius > 500 ? NEXT_TO[area] || [] : [];
      $('aWho').innerHTML = `Residents in <b>${esc([area, ...near].join(', '))}</b> will be told.`;
    };
    $('aRadius').addEventListener('input', preview);
    $('aArea').addEventListener('change', preview);
    preview();
    $('upgradeMfa')?.addEventListener('click', async () => { await switchToken('dev_admin_mfa'); redraw(); });

    $('alertForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const out = $('aResult');
      const btn = $('aSubmit');
      btn.disabled = true;
      out.hidden = false;
      out.innerHTML = '<span class="muted">Publishing…</span>';
      try {
        if (kind === 'outage') {
          await createOutage(getCurrentToken(), {
            title: $('aTitle').value, provider: $('oProvider').value, description: $('aDesc').value,
            affected_areas: $('oAreas').value.split(',').map((s) => s.trim()).filter(Boolean),
          });
          out.innerHTML = '<b class="ok">Published.</b><p style="margin-top:4px">The outage is live for residents.</p>';
        } else {
          const opt = $('aArea').options[$('aArea').selectedIndex];
          const created = await createAreaAlert(getCurrentToken(), {
            title: $('aTitle').value, description: $('aDesc').value, type: kind, severity: $('aSeverity').value,
            latitude: Number(opt.dataset.lat), longitude: Number(opt.dataset.lng), radius_meters: Number($('aRadius').value), neighbourhood: opt.value,
          });
          out.innerHTML = `<b class="ok">Published.</b><p style="margin-top:4px">${esc(created.affected_residents_count || 0)} residents in ${esc((created.affected_neighbourhoods || []).join(', '))} were told.</p>`;
        }
        showToast?.('Alert published.');
        setTimeout(redraw, 1800);
      } catch (err) {
        if (err.status === 403 && String(err.message).toLowerCase().includes('mfa')) {
          out.innerHTML = '<b class="bad">A second check is needed.</b><p style="margin-top:4px">Verify with your passkey, then publish again.</p>';
        } else {
          out.innerHTML = `<b class="bad">Could not publish.</b><p style="margin-top:4px">${esc(err.message)}</p>`;
        }
        btn.disabled = false;
      }
    });
  },
};

/* ---------------------------------------------------------- Scan a notice (P4) */
// A photo of a notice taped to a door becomes a draft outage (Gemini reads it); staff check every field and publish.
const NOTICE_PROVIDERS = [['colterm', 'Colterm (heating, hot water)'], ['aquatim', 'Aquatim (water, sewage)'], ['retele_electrice_banat', 'Rețele Electrice Banat (power)'], ['delgaz_grid', 'Delgaz Grid (gas)']];
const NOTICE_TYPES = [['heating_and_hot_water', 'Heating and hot water'], ['hot_water_only', 'Hot water only'], ['cold_water', 'Cold water'], ['electricity', 'Electricity'], ['gas', 'Gas']];
const NOTICE_STATUS = [['scheduled_maintenance', 'Planned works'], ['unplanned_breakdown', 'Breakdown']];
const NOTICE_SEVERITY = [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']];
// when Gemini could not read a value, the list starts on an empty "choose" entry and the field is required
const options = (list, value) =>
  (list.some(([v]) => v === value) ? '' : '<option value="" selected>Choose…</option>') +
  list.map(([v, label]) => `<option value="${v}" ${v === value ? 'selected' : ''}>${esc(label)}</option>`).join('');
// ISO <-> the value of <input type="datetime-local"> (the browser's own time zone: the staff laptop in Timișoara)
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

const notice = {
  async render() {
    const mfa = hasMfa();
    return `
      <h1 class="page-title">Scan a notice</h1>
      <p class="page-sub">Take or pick a photo of a printed notice from a utility company. Gemini reads it and fills in a draft; you check it and publish it as an outage.</p>
      <div class="cols section">
        <div class="stack">
          <label class="btn btn-primary" for="nFile" tabindex="0" role="button" id="nFileBtn" style="align-self:flex-start;cursor:pointer">Take or choose a photo</label>
          <input type="file" id="nFile" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" hidden>
          <img id="nPreview" alt="The notice photo" hidden style="max-width:100%;max-height:420px;border-radius:18px;box-shadow:var(--ring)">
          <div class="result" id="nStatus" hidden></div>
        </div>
        <div>
          <form class="stack" id="nForm" hidden>
            <div class="section-head"><h2>Draft: check before publishing</h2></div>
            <div class="notice" id="nWarnings" hidden></div>
            <div class="two">
              <label class="field"><span>Provider</span><select id="nProvider" required></select></label>
              <label class="field"><span>What stops</span><select id="nType" required></select></label>
            </div>
            <div class="two">
              <label class="field"><span>Kind</span><select id="nStatusSel"></select></label>
              <label class="field"><span>How serious</span><select id="nSeverity"></select></label>
            </div>
            <label class="field"><span>Title</span><input id="nTitle" maxlength="140" required></label>
            <label class="field"><span>Description</span><textarea id="nDesc" rows="3" maxlength="600" required></textarea></label>
            <label class="field"><span>Areas, separated by commas</span><input id="nAreas" required></label>
            <label class="field"><span>Streets, one per line</span><textarea id="nStreets" rows="3"></textarea></label>
            <div class="two">
              <label class="field"><span>Starts</span><input type="datetime-local" id="nStart"></label>
              <label class="field"><span>Back by</span><input type="datetime-local" id="nEnd"></label>
            </div>
            <div class="mfa ${mfa ? 'ok' : 'warn'}"><span>${mfa ? 'Second check done for this session.' : 'Publishing needs a second check first.'}</span>${mfa ? '' : '<button class="btn btn-secondary btn-sm" type="button" id="nMfa">Verify with passkey</button>'}</div>
            <div><button class="btn btn-primary" type="submit" id="nPublish">Publish alert</button></div>
            <div class="result" id="nResult" hidden></div>
          </form>
        </div>
      </div>`;
  },
  mount(ctx, showToast, redraw) {
    const $ = (id) => document.getElementById(id);
    const say = (html) => { $('nStatus').hidden = false; $('nStatus').innerHTML = html; };
    $('nMfa')?.addEventListener('click', async () => { await switchToken('dev_admin_mfa'); redraw(); });

    const fill = (d) => {
      $('nProvider').innerHTML = options(NOTICE_PROVIDERS, d.provider);
      $('nType').innerHTML = options(NOTICE_TYPES, d.type);
      $('nStatusSel').innerHTML = options(NOTICE_STATUS, d.status);
      $('nSeverity').innerHTML = options(NOTICE_SEVERITY, d.severity);
      $('nTitle').value = d.title || '';
      $('nDesc').value = d.description || '';
      $('nAreas').value = (d.affected_areas || []).join(', ');
      $('nStreets').value = (d.affected_streets || []).join('\n');
      $('nStart').value = toLocalInput(d.start_time);
      $('nEnd').value = toLocalInput(d.estimated_restore_time);
    };

    // the picker is a label so it opens the camera on phones; Enter and Space open it from the keyboard too
    $('nFileBtn')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('nFile').click(); } });
    $('nFile').addEventListener('change', async () => {
      const file = $('nFile').files?.[0];
      if (!file) return;
      $('nPreview').src = URL.createObjectURL(file);
      $('nPreview').hidden = false;
      $('nForm').hidden = true;
      $('nResult').hidden = true;
      say('<span class="muted">Gemini is reading the notice…</span>');
      try {
        const r = await parseNoticePhoto(file);
        if (!r.isNotice || !r.draft) {
          say(`<b class="bad">This does not look like a utility notice.</b><p style="margin-top:4px">${esc(r.reason || 'Try a clearer photo of the whole notice.')}</p>`);
          return;
        }
        fill(r.draft);
        const warnings = r.warnings || [];
        $('nWarnings').hidden = warnings.length === 0;
        $('nWarnings').innerHTML = warnings.length ? `<b>Check these:</b> ${warnings.map(esc).join(' · ')}` : '';
        $('nForm').hidden = false;
        say(`<b class="ok">Draft ready.</b><p style="margin-top:4px">${warnings.length ? 'Gemini flagged a few things to check.' : 'Check every field, then publish.'} Nothing is published until you press the button.</p>`);
      } catch (err) {
        say(`<b class="bad">Could not read the photo.</b><p style="margin-top:4px">${esc(err.status === 503 || err.status === 429 ? 'Gemini is busy right now. Wait a few seconds and try again.' : err.message)}</p>`);
      }
    });

    $('nForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const out = $('nResult');
      const btn = $('nPublish');
      btn.disabled = true;
      out.hidden = false;
      out.innerHTML = '<span class="muted">Publishing…</span>';
      try {
        const { outage } = await confirmNotice(getCurrentToken(), {
          provider: $('nProvider').value,
          type: $('nType').value,
          status: $('nStatusSel').value,
          severity: $('nSeverity').value,
          title: $('nTitle').value,
          description: $('nDesc').value,
          affected_areas: $('nAreas').value.split(',').map((s) => s.trim()).filter(Boolean),
          affected_streets: $('nStreets').value.split('\n').map((s) => s.trim()).filter(Boolean),
          start_time: fromLocalInput($('nStart').value),
          estimated_restore_time: fromLocalInput($('nEnd').value),
        });
        out.innerHTML = `<b class="ok">Published.</b><p style="margin-top:4px">"${esc(outage?.title || $('nTitle').value)}" is live for residents in the app's outages and alerts.</p>`;
        showToast?.('Alert published.');
      } catch (err) {
        out.innerHTML = err.status === 403 && /mfa/i.test(`${err.message} ${err.data?.error || ''}`)
          ? '<b class="bad">A second check is needed.</b><p style="margin-top:4px">Verify with your passkey, then publish again.</p>'
          : `<b class="bad">Could not publish.</b><p style="margin-top:4px">${esc(err.message)}</p>`;
        btn.disabled = false;
      }
    });
  },
};

/* ------------------------------------------------------------ Ask the data (P4) */
// A staff question becomes one Gemini request that mixes our data tools (Tiger Cloud history, residents' reports,
// Open-Meteo wind) with Gemini's own code execution: it runs Python on the real numbers and can draw a chart.
const ANALYST_EXAMPLES = [
  'At what hour of the day is parking in the city most full? Last 7 days.',
  'When were the most smell reports in the last 24 hours, and does it line up with the wind?',
  'Compare PM2.5 across areas over the last 3 days. Which area is worst?',
  'At what time of day do residents report feeling unsafe, and where?',
];
const ANALYST_SOURCES = {
  get_parking_occupancy: 'Parking history', get_city_metrics: 'Air, noise and smell sensors', get_smell_reports: 'Residents\' smell reports',
  get_safety_reports: 'Residents\' safety reports', get_wind_history: 'Measured wind',
};
const SOURCE_LABEL = { tiger: 'Tiger Cloud', postgres: 'Tiger Cloud', memory: 'in memory', 'open-meteo': 'Open-Meteo', unavailable: 'unavailable' };
const ANALYST_PHASES = ['Fetching the data…', 'Gemini is writing and running Python…', 'Checking the numbers and drawing the chart…'];

/** Gemini's short markdown (bold, bullet lists) as safe HTML. */
function analystMarkdown(text) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
  let html = '';
  let inList = false;
  for (const raw of String(text).split('\n')) {
    const line = raw.trimEnd();
    const item = line.match(/^\s*[*-]\s+(.*)$/);
    if (item) {
      if (!inList) { html += '<ul class="analyst-list">'; inList = true; }
      html += `<li${/^\s{2,}/.test(line) ? ' class="sub"' : ''}>${inline(item[1])}</li>`;
      continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    if (line.trim()) html += `<p>${inline(line.trim())}</p>`;
  }
  return html + (inList ? '</ul>' : '');
}

/* ------------------------------------------------------------ Incident radar (P4) */
// Residents' smell and safety reports, forum posts and official outages about the same problem in the same area,
// linked by Gemini embeddings; Gemini writes each card. Every link and its similarity is shown, so staff can judge it.
const URGENCY = { high: ['High', 'danger'], medium: ['Medium', 'apricot'], low: ['Low', 'mint'] };
const SOURCE_NAMES = {
  smell: (n) => `${n} smell ${n === 1 ? 'report' : 'reports'}`,
  safety: (n) => `${n} safety ${n === 1 ? 'report' : 'reports'}`,
  forum: (n) => `${n} forum ${n === 1 ? 'post' : 'posts'}`,
  outage: (n) => (n === 1 ? 'Official outage' : `${n} official outages`),
};
const SOURCE_SHORT = { smell: 'smell reports', safety: 'safety reports', forum: 'forum post', outage: 'official outage' };
const RADAR_WINDOWS = [[24, '24 h'], [48, '48 h'], [168, '7 days']];
let radarHours = 48;

const timeSpan = (from, to) => {
  const f = new Intl.DateTimeFormat(getLang() === 'ro' ? 'ro-RO' : 'en-GB', { timeZone: 'Europe/Bucharest', weekday: 'short', hour: '2-digit', minute: '2-digit' });
  return from === to ? f.format(new Date(from)) : `${f.format(new Date(from))} – ${f.format(new Date(to))}`;
};

const incidents = {
  async render() {
    const mfa = hasMfa();
    return `
      <h1 class="page-title">Incident radar</h1>
      <p class="page-sub">Residents' reports, forum posts and official outages about the same problem, grouped by Gemini embeddings. Gemini writes each card and double-checks every link.</p>
      <div class="chips section" id="irWindows" role="group" aria-label="Time window">${RADAR_WINDOWS.map(([h, label]) => `<button type="button" class="chip ${h === radarHours ? 'on' : ''}" data-h="${h}">${label}</button>`).join('')}<button type="button" class="chip" id="irRefresh">Refresh</button></div>
      ${mfa ? '' : '<div class="mfa warn section"><span>Staff tools need a second check first.</span><button class="btn btn-secondary btn-sm" type="button" id="irMfa">Verify with passkey</button></div>'}
      <div id="irBody" class="section" aria-live="polite"><p class="muted">Gemini is reading the city's signals…</p></div>`;
  },
  mount(ctx, showToast, redraw) {
    const $ = (id) => document.getElementById(id);
    let alive = true;
    $('irMfa')?.addEventListener('click', async () => { await switchToken('dev_admin_mfa'); redraw(); });
    document.querySelectorAll('#irWindows [data-h]').forEach((b) => b.addEventListener('click', () => { radarHours = Number(b.dataset.h); redraw(); }));

    const lang = getLang() === 'ro' ? 'ro' : 'en';
    const draw = (r) => {
      const linksOk = r.links.filter((l) => !l.rejected);
      const cards = r.incidents.map((inc, i) => {
        const [uLabel, uColor] = URGENCY[inc.urgency] || URGENCY.low;
        const chips = Object.entries(inc.counts).filter(([, n]) => n > 0).map(([s, n]) => `<span class="ir-src ir-${s}">${esc(SOURCE_NAMES[s](n))}</span>`).join('');
        const texts = inc.members.filter((m) => m.source === 'forum' || m.source === 'outage');
        return `
          <article class="ir-card">
            <div class="ir-head"><span class="ir-urgency" style="color:var(--${uColor})">${esc(uLabel)}</span><span class="muted">${esc(inc.areas.join(', '))} · ${esc(timeSpan(inc.firstAt, inc.lastAt))}</span></div>
            <h2 class="ir-title">${esc(inc.title[lang])}</h2>
            <p>${esc(inc.summary[lang])}</p>
            ${inc.action ? `<p class="ir-action"><b>Suggested next step:</b> ${esc(inc.action[lang])}</p>` : ''}
            <div class="ir-srcs">${chips}${inc.demoReports ? `<span class="ir-src ir-demo">${esc(`${inc.demoReports} demo`)}</span>` : ''}</div>
            ${texts.length ? `<ul class="ir-texts">${texts.map((m) => `<li><span class="muted">${esc(SOURCE_SHORT[m.source])}${m.similarity ? ` · ${esc(`similarity ${m.similarity.toFixed(2)}`)}` : ''}</span> ${esc(m.label)}</li>`).join('')}</ul>` : ''}
            <button class="btn btn-secondary btn-sm" type="button" data-ask="${i}">Ask the data about this</button>
          </article>`;
      }).join('');
      $('irBody').innerHTML = `
        <div class="stats" style="margin-top:0">
          ${kpi(r.incidents.length, 'Incidents')}
          ${kpi(r.signals.smell + r.signals.safety, 'Resident reports')}
          ${kpi(r.signals.forum, 'Forum posts read')}
          ${kpi(linksOk.length, 'Links found by embeddings', 'blue')}
        </div>
        ${r.note ? `<div class="notice section">${esc(r.note)}</div>` : ''}
        <div class="ir-grid section">${cards || '<div class="empty">No incidents in this time window.</div>'}</div>
        <div class="section-head" style="margin-top:28px"><h2>How Gemini grouped these</h2></div>
        <div class="list">${r.links.map((l) => row({
          title: `“${esc(l.from)}” → ${esc(l.to)}`,
          detail: `${esc(SOURCE_SHORT[l.fromSource])} → ${esc(SOURCE_SHORT[l.toSource])} · ${esc(l.area)} · ${esc(`similarity ${l.similarity.toFixed(2)}`)}${l.rejected ? ` · ${esc('taken out again by Gemini: different problem')}` : ''}`,
        })).join('') || row({ title: 'No links in this time window', detail: 'No forum post or outage matched a group of reports closely enough.' })}</div>
        <p class="muted" style="margin-top:12px;font-size:13px">${esc(`${r.embeddingModel} (semantic similarity, same area, at least 0.83)`)} · ${esc(r.cardModel ? `cards by ${r.cardModel}` : 'plain cards (Gemini unavailable)')}${r.cached ? ` · ${esc('cached for 5 minutes')}` : ''} · Residents' reports are unverified.</p>`;
      document.querySelectorAll('#irBody [data-ask]').forEach((b) => b.addEventListener('click', () => {
        const inc = r.incidents[Number(b.dataset.ask)];
        const q = lang === 'ro'
          ? `Spune-mi mai multe despre: ${inc.title.ro}. Când apare, cum evoluează și se potrivește cu vântul sau cu alte date?`
          : `Tell me more about: ${inc.title.en}. When does it happen, how is it changing, and does it line up with the wind or other data?`;
        try { sessionStorage.setItem('hub_analyst_question', q); } catch {}
        document.querySelector('.dash-nav [data-section="analyst"]')?.click();
      }));
    };

    const load = (fresh) => fetchIncidents(getCurrentToken(), radarHours, fresh).then((r) => { if (alive) draw(r); }).catch((err) => {
      if (!alive) return;
      $('irBody').innerHTML = err.status === 403 && /mfa/i.test(`${err.message} ${err.data?.error || ''}`)
        ? '<div class="empty">A second check is needed. Verify with your passkey.</div>'
        : `<div class="empty">The incident radar is not available right now. ${esc(err.message)}</div>`;
    });
    $('irRefresh').addEventListener('click', () => {
      $('irBody').innerHTML = `<p class="muted">${esc("Gemini is reading the city's signals…")}</p>`;
      load(true);
    });
    load(false);
    return () => { alive = false; };
  },
};

const analyst = {
  async render() {
    const mfa = hasMfa();
    return `
      <h1 class="page-title">Ask the data</h1>
      <p class="page-sub">Ask about parking, air, noise, smells or safety reports. Gemini fetches the real numbers from Tiger Cloud and the city's modules, runs its own Python on them and draws a chart.</p>
      <form class="stack section" id="anForm" style="max-width:760px">
        <label class="field"><span>Your question</span><textarea id="anQ" rows="3" maxlength="500" required placeholder="${esc(ANALYST_EXAMPLES[0])}"></textarea></label>
        <div class="chips" id="anExamples">${ANALYST_EXAMPLES.map((q, i) => `<button type="button" class="chip" data-q="${i}">${esc(q)}</button>`).join('')}</div>
        ${mfa ? '' : '<div class="mfa warn"><span>Staff tools need a second check first.</span><button class="btn btn-secondary btn-sm" type="button" id="anMfa">Verify with passkey</button></div>'}
        <div><button class="btn btn-primary" type="submit" id="anAsk">Ask</button></div>
      </form>
      <div class="result" id="anStatus" hidden aria-live="polite"></div>
      <div id="anOut" class="section" hidden></div>`;
  },
  mount(ctx, showToast, redraw) {
    const $ = (id) => document.getElementById(id);
    let timer = null;
    let alive = true;
    $('anMfa')?.addEventListener('click', async () => { await switchToken('dev_admin_mfa'); redraw(); });
    // a question handed over from the incident radar ("Ask the data about this")
    try {
      const handed = sessionStorage.getItem('hub_analyst_question');
      if (handed) { sessionStorage.removeItem('hub_analyst_question'); $('anQ').value = handed; $('anQ').focus(); }
    } catch {}
    document.querySelectorAll('#anExamples [data-q]').forEach((b) => b.addEventListener('click', () => {
      $('anQ').value = ANALYST_EXAMPLES[Number(b.dataset.q)];
      $('anQ').focus();
    }));

    const say = (html) => { $('anStatus').hidden = false; $('anStatus').innerHTML = html; };
    $('anForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const question = $('anQ').value.trim();
      if (!question) return;
      $('anAsk').disabled = true;
      $('anOut').hidden = true;
      let phase = 0;
      const started = Date.now();
      // phase text and seconds in separate spans so the website's translator still recognises the phase text
      const tick = () => say(`<span class="muted"><span>${esc(ANALYST_PHASES[Math.min(phase, ANALYST_PHASES.length - 1)])}</span> <span>${Math.round((Date.now() - started) / 1000)} s</span></span>`);
      tick();
      timer = setInterval(() => { if (Date.now() - started > 4000 * (phase + 1)) phase++; tick(); }, 1000);
      try {
        const r = await askAnalyst(getCurrentToken(), question, getLang());
        if (!alive) return;
        $('anStatus').hidden = true;
        const tools = r.steps.filter((s) => s.kind === 'tool');
        const code = r.steps.filter((s) => s.kind === 'code' && s.code);
        const failed = code.filter((s) => s.outcome && s.outcome !== 'OUTCOME_OK').length;
        $('anOut').innerHTML = `
          <div class="analyst-grid">
            <div class="analyst-answer">${analystMarkdown(r.answer)}</div>
            <div>${r.charts.map((c, i) => `<img class="analyst-chart" alt="Chart ${i + 1} drawn by Gemini" src="data:${esc(c.mimeType)};base64,${c.data}">`).join('') || '<div class="empty">No chart for this question.</div>'}</div>
          </div>
          <div class="section-head" style="margin-top:20px"><h2>How Gemini got this</h2></div>
          <div class="list">
            ${tools.map((s) => row({ title: esc(ANALYST_SOURCES[s.name] || s.name), detail: `${esc(SOURCE_LABEL[s.source] || s.source || '')} · ${esc(Object.entries(s.args || {}).map(([k, v]) => `${k} ${v}`).join(', ') || 'default range')}` })).join('')
              || row({ title: 'No data was fetched', detail: 'Gemini answered without the city data.' })}
            ${row({ title: `Ran Python ${code.length} ${code.length === 1 ? 'time' : 'times'}`, detail: failed ? `It fixed its own code ${failed} ${failed === 1 ? 'time' : 'times'} along the way` : 'Every run worked first time' })}
          </div>
          <details class="analyst-code"><summary>Show the Python Gemini ran</summary>
            ${code.map((s, i) => `<p class="muted">Run ${i + 1}${s.outcome && s.outcome !== 'OUTCOME_OK' ? ' (failed, then fixed)' : ''}</p><pre><code>${esc(s.code)}</code></pre>${s.output ? `<pre class="out">${esc(s.output)}</pre>` : ''}`).join('')}
          </details>
          <p class="muted" style="margin-top:12px;font-size:13px">${esc(r.model)} · ${(r.ms / 1000).toFixed(1)} s · Residents' reports are unverified. A pattern in the data is not proof of a cause.</p>`;
        $('anOut').hidden = false;
      } catch (err) {
        if (!alive) return;
        say(err.status === 403 && /mfa/i.test(`${err.message} ${err.data?.error || ''}`)
          ? '<b class="bad">A second check is needed.</b><p style="margin-top:4px">Verify with your passkey, then ask again.</p>'
          : `<b class="bad">Could not answer.</b><p style="margin-top:4px">${esc(err.status === 503 || err.status === 429 ? 'Gemini is busy right now. Wait a few seconds and try again.' : err.message)}</p>`);
      } finally {
        clearInterval(timer);
        if (alive) $('anAsk').disabled = false;
      }
    });
    return () => { alive = false; clearInterval(timer); };
  },
};

/* ----------------------------------------------------------------- Parking */
// The live camera of a lot (Parkie's vision agent) and Parkie's slot editor. The agent reports occupancy every 15 s.
const parking = {
  async render() {
    const [lots, feed] = await Promise.all([fetchLots(), hubGet('/v1/m/parkie/feed').catch(() => null)]);
    const lotId = feed?.lotId || lots[0]?.id;
    return `
      <h1 class="page-title">Parking cameras</h1>
      <p class="page-sub">The camera feed of a lot, read by the vision model. Draw each parking spot on a frame; the model counts the cars in them.</p>
      <div class="park-head">
        <label class="field" style="min-width:280px"><span>Parking lot</span><select id="parkLot">${lots.map((l) => `<option value="${esc(l.id)}" ${l.id === lotId ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>
        <div class="park-stats" id="parkStats"></div>
      </div>

      <div class="park-feed section">
        <div class="section-head"><h2>Live feed</h2><span class="live-tag" id="parkLive" hidden><i></i>Live</span></div>
        <div id="parkFeedBox"></div>
      </div>

      <div class="section">
        <div class="section-head"><h2>Parking spots</h2><span class="muted" id="parkCount"></span></div>
        <p class="muted" style="font-size:14px;margin-bottom:12px">Step 1: capture a frame from the camera. Step 2: click the 4 corners of each parking spot on it. Drag a corner to move it.</p>
        <div class="toolbar-group" style="margin-bottom:12px">
          <button class="btn btn-secondary btn-md" id="parkCapture">Capture frame</button>
          <span class="muted" id="parkCaptureStatus" aria-live="polite"></span>
        </div>
        <div class="park-canvas"><canvas id="parkCanvas" width="0" height="0"></canvas><div class="empty" id="parkPlaceholder">Capture a frame to start drawing.</div></div>
        <div class="toolbar-group" id="parkControls" style="margin-top:12px" hidden>
          <button class="btn btn-secondary btn-md" id="parkUndo">Undo last point</button>
          <button class="btn btn-secondary btn-md" id="parkClear">Clear all</button>
          <button class="btn btn-primary btn-md" id="parkSave">Save spots</button>
        </div>
      </div>`;
  },
  mount(ctx, showToast) {
    const $ = (id) => document.getElementById(id);
    let editor = null;
    let lots = [];
    let feed = null;
    let alive = true;

    const lot = () => lots.find((l) => l.id === $('parkLot').value);
    const drawStats = () => {
      const l = lot();
      if (!l) return;
      const occupied = Math.max(0, l.capacity - l.available_spots);
      $('parkStats').innerHTML = `
        <div><b style="color:var(--mint)">${esc(l.available_spots)}</b><span>Free</span></div>
        <div><b style="color:var(--apricot)">${esc(occupied)}</b><span>Occupied</span></div>
        <div><b>${esc(l.capacity)}</b><span>Spots</span></div>`;
      $('parkCount').textContent = `${(l.slots_data || []).length} drawn`;
    };
    const drawFeed = () => {
      const isFeedLot = !!feed?.running && feed.lotId === $('parkLot').value;
      $('parkLive').hidden = !isFeedLot;
      const feedLotName = lots.find((l) => l.id === feed?.lotId)?.name || 'another lot';
      $('parkFeedBox').innerHTML = isFeedLot
        ? `<img class="park-stream" src="${esc(feed.overlayUrl)}" alt="Live camera of ${esc(lot()?.name || 'the lot')}, with the parking spots marked free or occupied">`
        : `<div class="empty">${feed?.running ? `The camera is connected to ${esc(feedLotName)}.` : 'The camera is not running. Start the API with PARKIE_VIDEO set.'}</div>`;
      $('parkCapture').disabled = !isFeedLot;
    };
    const resetEditor = () => {
      editor?.destroy();
      editor = null;
      $('parkControls').hidden = true;
      $('parkPlaceholder').hidden = false;
      $('parkCanvas').width = 0;
      $('parkCaptureStatus').textContent = '';
    };
    const refresh = async () => {
      const next = await fetchLots();
      if (!alive) return;
      lots = next;
      drawStats();
    };

    Promise.all([fetchLots(), hubGet('/v1/m/parkie/feed').catch(() => null)]).then(([l, f]) => {
      if (!alive) return;
      lots = l;
      feed = f;
      drawStats();
      drawFeed();
    });
    $('parkLot').addEventListener('change', () => { resetEditor(); drawStats(); drawFeed(); });
    const timer = setInterval(refresh, 5000);

    $('parkCapture').addEventListener('click', async () => {
      const btn = $('parkCapture');
      btn.disabled = true;
      $('parkCaptureStatus').textContent = 'Capturing…';
      try {
        editor?.destroy();
        const l = lot();
        editor = createLotEditor({
          canvas: $('parkCanvas'),
          slots: l?.slots_data || [],
          onSave: (slots) => saveLotPlots(l.id, { camera_url: l.camera_url || feed?.video || 'demo3.MOV', slots_data: slots, capacity: slots.length }),
        });
        await editor.setFrame(`${feed.snapshotUrl}?t=${Date.now()}`);
        $('parkCaptureStatus').textContent = 'Frame captured.';
        $('parkControls').hidden = false;
        $('parkPlaceholder').hidden = true;
      } catch (err) {
        $('parkCaptureStatus').textContent = `Could not capture: ${err.message}`;
      } finally {
        btn.disabled = false;
      }
    });
    $('parkUndo').addEventListener('click', () => editor?.undo());
    $('parkClear').addEventListener('click', () => editor?.clear());
    $('parkSave').addEventListener('click', async () => {
      const btn = $('parkSave');
      btn.disabled = true;
      try {
        const n = await editor.save();
        showToast?.(`Saved ${n} ${n === 1 ? 'spot' : 'spots'}. The camera picks them up within 15 seconds.`);
        await refresh();
      } catch (err) {
        showToast?.(err.message);
      } finally {
        btn.disabled = false;
      }
    });

    return () => {
      alive = false;
      clearInterval(timer);
      editor?.destroy();
    };
  },
};

/* --------------------------------------------------------------- Analytics */
// The feedback summed up: averages and shares, drawn as charts. Nothing here says how many people answered.
let showExample = false;
const oneDecimal = (n) => Number(n).toFixed(1);
const shortDate = (iso) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' });

const analytics = {
  async render() {
    let a = null;
    if (showExample) a = EXAMPLE_ANALYTICS;
    else {
      try { a = (await hubGet('/v1/m/feedback/analytics')).analytics; } catch { a = null; }
    }
    const head = `<h1 class="page-title">Analytics</h1>
      <p class="page-sub">What people tell us about hop, summed up as averages and shares.</p>`;
    if (!a) return `${head}<div class="empty">The analytics are not available right now.</div>`;
    if (!a.hasData) {
      return `${head}<div class="empty section"><b>No feedback yet</b><br>The charts appear here once people send feedback in the app or fill in the survey.
        <br><button class="btn btn-secondary btn-md" id="anExample" style="margin-top:16px">Show example charts</button></div>`;
    }
    const h = a.headline;
    const stat = (value, label, text) => `<div class="stat"><b class="${text ? 'stat-text' : ''}">${esc(value)}</b><span>${esc(label)}</span></div>`;
    const feature = (r) => ({ label: moduleLabel(r.id), value: r.share, hue: hueOf(r.id) });
    return `${head}
      <div class="example-note" ${showExample ? '' : 'hidden'}>Example data, not real feedback. <button class="link" id="anReal">Show the real figures</button></div>
      <div class="stats">
        ${stat(h.avgAppRating == null ? '–' : oneDecimal(h.avgAppRating), 'Average app rating, out of 5')}
        ${stat(h.avgInstallLikelihood == null ? '–' : oneDecimal(h.avgInstallLikelihood), 'Likelihood to install, out of 5')}
        ${stat(h.mostWantedFeature ? moduleLabel(h.mostWantedFeature.id) : '–', 'Feature people want most', true)}
        ${stat(h.biggestProblem ? moduleLabel(h.biggestProblem.id) : '–', 'Problem that affects people most', true)}
      </div>

      <div class="cols even section">
        ${a.topPick.length ? `<div><div class="section-head"><h2>What they would use most</h2></div>
          ${donut(a.topPick.map(feature), { title: 'What they would use most', centre: { big: moduleLabel(a.topPick[0].id), small: 'is the top pick' } })}</div>` : ''}
        ${a.wanted.length ? `<div><div class="section-head"><h2>Features people want</h2></div>
          ${bars(a.wanted.map(feature), { title: 'Features people want' })}</div>` : ''}
      </div>

      <div class="cols even section">
        ${a.problems.length ? `<div><div class="section-head"><h2>How much each problem affects them</h2></div>
          <p class="muted chart-note">Average, from 1 (not at all) to 5 (a lot).</p>
          ${bars(a.problems.map((r) => ({ label: moduleLabel(r.id), value: r.avg, hue: hueOf(r.id) })), { max: 5, format: oneDecimal, title: 'How much each problem affects them' })}</div>` : ''}
        <div><div class="section-head"><h2>How the app is rated</h2></div>
          <p class="muted chart-note">Share of ratings by number of stars.</p>
          ${columns(a.ratingSpread.map((r) => ({ label: `${r.stars} stars`, value: r.share, hue: r.stars >= 4 ? 'mint' : r.stars === 3 ? 'blue' : 'apricot' })), { max: Math.max(40, ...a.ratingSpread.map((r) => r.share)), title: 'How the app is rated' })}
          ${a.ratingByModule.length ? `<p class="muted chart-note" style="margin-top:22px">Average rating by part of the app.</p>
          ${bars(a.ratingByModule.map((r) => ({ label: moduleLabel(r.id), value: r.avg, hue: hueOf(r.id) })), { max: 5, format: oneDecimal, title: 'Average rating by part of the app' })}` : ''}
        </div>
      </div>

      ${a.versions.some((v) => v.avgAppRating != null) ? `<div class="section"><div class="section-head"><h2>Rating by version</h2></div>
        <p class="muted chart-note">Average app rating after each update.</p>
        ${columns(a.versions.filter((v) => v.avgAppRating != null).map((v) => ({ label: v.appVersion, value: v.avgAppRating, hue: 'blue' })), { max: 5, format: oneDecimal, title: 'Rating by version' })}</div>` : ''}

      ${a.roles.length || a.ages.length ? `<div class="cols even section">
        ${a.roles.length ? `<div><div class="section-head"><h2>Who is answering</h2></div>${donut(a.roles.map((r) => ({ label: r.id, value: r.share })), { title: 'Who is answering' })}</div>` : ''}
        ${a.ages.length ? `<div><div class="section-head"><h2>Age</h2></div>${donut(a.ages.map((r) => ({ label: r.id, value: r.share })), { title: 'Age' })}</div>` : ''}
      </div>` : ''}

      ${a.comments.length ? `<div class="section"><div class="section-head"><h2>In their words</h2></div>
        <div class="list">${a.comments.map((c) => row({
          art: art('feedback', 44),
          title: esc(c.text),
          detail: `${c.kind === 'in-app' ? (c.moduleId ? `About ${esc(moduleLabel(c.moduleId))}` : 'About the app') : c.kind === 'confusing' ? 'Found confusing' : 'Is missing'} · ${esc(shortDate(c.at))}`,
        })).join('')}</div></div>` : ''}`;
  },
  mount(ctx, showToast, redraw) {
    document.getElementById('anExample')?.addEventListener('click', () => { showExample = true; redraw(); });
    document.getElementById('anReal')?.addEventListener('click', () => { showExample = false; redraw(); });
  },
};

/* -------------------------------------------------------------- Moderation */
const moderation = {
  async render() {
    return `<h1 class="page-title">Moderation</h1>
      <p class="page-sub">Forum posts that residents flagged. Keep a post to dismiss the flags, or remove it for good.</p>
      <div class="list section" id="moderationList"><div class="empty">Loading the queue…</div></div>`;
  },
  mount(ctx, showToast) {
    const box = document.getElementById('moderationList');
    const load = async () => {
      try {
        const posts = await fetchReportedPosts();
        box.innerHTML = posts.length
          ? posts.map((p) => `
            <div class="row" style="align-items:flex-start">
              <div class="art">${art('forum', 52)}</div>
              <div class="body">
                <div class="title">${esc(p.title)}</div>
                <div class="detail">${esc((p.content || '').slice(0, 220))}</div>
                <div class="detail">By ${esc(p.authorName)} · flagged ${p.reportCount} ${p.reportCount === 1 ? 'time' : 'times'}${p.reportReasons?.length ? ` (${esc(p.reportReasons.join('; '))})` : ''}</div>
              </div>
              <div class="toolbar-group"><button class="btn btn-secondary btn-sm" data-keep="${esc(p.id)}">Keep</button><button class="btn btn-danger btn-sm" data-remove="${esc(p.id)}">Remove</button></div>
            </div>`).join('')
          : '<div class="empty">Nothing flagged. The forum is clean.</div>';
        box.querySelectorAll('[data-keep]').forEach((b) => b.addEventListener('click', async () => { await approveReportedPost(b.dataset.keep); showToast?.('Post kept.'); load(); }));
        box.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', async () => { await removeReportedPost(b.dataset.remove); showToast?.('Post removed.'); load(); }));
      } catch (err) {
        box.innerHTML = `<div class="empty">${esc(err.message)}</div>`;
      }
    };
    load();
  },
};

/* ---------------------------------------------------------------- Security */
const security = {
  async render() {
    const logs = (await fetchAuditLogs(20)) || [];
    return `<h1 class="page-title">Security log</h1>
      <p class="page-sub">Every sign-in decision and privileged action, newest first.</p>
      <div class="list section">${logs.map((l) => row({
        title: esc(l.action),
        detail: `${esc(l.user_email || 'Anonymous')} · ${esc(l.user_role || 'guest')}`,
        side: `<span class="tag ${String(l.outcome).toLowerCase().startsWith('allow') || String(l.outcome).toLowerCase() === 'success' ? 'mint' : 'apricot'}">${esc(statusText(l.outcome || ''))}</span> <span class="muted" style="font-size:13px">${esc(new Date(l.created_at).toLocaleTimeString())}</span>`,
      })).join('') || '<div class="empty">Nothing logged yet.</div>'}</div>`;
  },
};

/* ---------------------------------------------------------------- Database */
const database = {
  async render() {
    const [t, o] = await Promise.all([fetchTigerStatus(), fetchDashboardOverview()]);
    const live = t?.status === 'connected';
    const tk = o?.kpis?.timescale_tiger_cloud;
    const comm = o?.kpis?.community_reports;
    const where = (c) => (c?.storage === 'postgres' ? 'saved in the database' : 'kept in memory only');
    return `<h1 class="page-title">Database</h1>
      <p class="page-sub">The time-series database behind sensors, parking and audit events.${live ? '' : ' The API has no database connection right now, so the figures below are examples.'}</p>
      <div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        ${kpi(live ? 'Connected' : t ? 'Example data' : 'Unreachable', 'Status', live ? 'mint' : 'apricot')}
        ${kpi(t?.hypertables?.length ?? '–', 'Time-series tables')}
        ${kpi(t?.continuous_aggregates?.length ?? '–', 'Live summaries')}
      </div>
      <div class="list section">
        ${row({ title: 'Version', detail: esc(t?.version || 'Not reported') })}
        ${row({ title: 'Compression', detail: esc(tk?.compression_ratio || 'Not reported') })}
        ${comm ? row({ title: 'Smell reports, last 7 days', detail: `${esc(comm.smell.last_7_days)} (${esc(comm.smell.real)} from residents) · ${where(comm.smell)}` }) : ''}
        ${comm ? row({ title: 'Safety reports, last 7 days', detail: `${esc(comm.safety.last_7_days)} (${esc(comm.safety.real)} from residents) · ${where(comm.safety)}` }) : ''}
      </div>`;
  },
};
