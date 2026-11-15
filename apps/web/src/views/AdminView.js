import { getCurrentToken, hasMfa, switchToken } from '../auth.js';
import {
  approveReportedPost, createAreaAlert, createOutage, fetchAreaAlerts, fetchAuditLogs, fetchDashboardOverview, fetchLots,
  captureCameraFrame, fetchOutages, fetchReportedPosts, fetchTigerStatus, removeReportedPost, saveLotPlots,
  parseNoticePhoto, confirmNotice, hubGet,
} from '../api.js';
import { createLotEditor } from '../components/ParkieLotEditor.js';
import { art, cap, esc, row, statusText } from '../ui.js';

let adminCanvas = null;

// The staff dashboard is one page with a side menu. Each entry is a section; only the open one is on screen.
const SECTIONS = [
  { group: 'City', items: [['overview', 'Overview'], ['alerts', 'Alerts'], ['notice', 'Scan a notice']] },
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
    adminCanvas = null;
    const section = { overview, alerts, notice, parking, moderation, security, database }[open];
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
  return () => { token += 1; adminCanvas = null; sectionCleanup(); };
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
              <div class="field"><div class="between"><span>Radius</span><b id="aRadiusLabel">700 m</b></div><input type="range" id="aRadius" min="150" max="2500" step="50" value="700" style="width:100%"><span id="aRadiusHint"></span></div>
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
          <label class="btn btn-primary" for="nFile" style="align-self:flex-start;cursor:pointer">Take or choose a photo</label>
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
