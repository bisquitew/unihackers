import { getCurrentToken, hasMfa, switchToken } from '../auth.js';
import {
  approveReportedPost, createAreaAlert, createOutage, fetchAreaAlerts, fetchAuditLogs, fetchDashboardOverview, fetchLots,
  captureCameraFrame, fetchOutages, fetchReportedPosts, fetchTigerStatus, removeReportedPost, saveLotPlots,
} from '../api.js';
import { CameraCanvas } from '../components/CameraCanvas.js';
import { art, cap, esc, row, statusText } from '../ui.js';

let adminCanvas = null;

// The staff dashboard is one page with a side menu. Each entry is a section; only the open one is on screen.
const SECTIONS = [
  { group: 'City', items: [['overview', 'Overview'], ['alerts', 'Alerts']] },
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

  const draw = async () => {
    const mine = ++token;
    nav.forEach((b) => b.classList.toggle('active', b.dataset.section === open));
    body.innerHTML = '<p class="muted">Loading…</p>';
    adminCanvas = null;
    const section = { overview, alerts, parking, moderation, security, database }[open];
    let html;
    try {
      html = await section.render(ctx);
    } catch (err) {
      console.error(err);
      html = `<div class="empty">Could not load this section. ${esc(err.message)}</div>`;
    }
    if (mine !== token) return;
    body.innerHTML = html;
    section.mount?.(ctx, showToast, draw);
  };
  nav.forEach((b) => b.addEventListener('click', () => { open = b.dataset.section; draw(); }));
  draw();
  return () => { token += 1; adminCanvas = null; };
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

/* ----------------------------------------------------------------- Parking */
const parking = {
  async render() {
    const lots = await fetchLots();
    return `
      <h1 class="page-title">Parking cameras</h1>
      <p class="page-sub">Mark each parking spot on the camera picture so free spots are counted correctly.</p>
      <div class="workspace-toolbar" style="margin-top:24px">
        <div class="toolbar-group">
          <select id="adminLotSelect" class="form-control" style="width:260px" aria-label="Parking lot">${lots.map((l) => `<option value="${esc(l.id)}">${esc(l.name)} (${l.available_spots}/${l.capacity})</option>`).join('')}</select>
          <button class="btn btn-secondary btn-md btn-active" id="adminSelectModeBtn">Select</button>
          <button class="btn btn-secondary btn-md" id="adminDrawModeBtn">Draw a spot</button>
          <button class="btn btn-secondary btn-md" id="adminAddGridBtn">Add 5 in a row</button>
        </div>
        <button class="btn btn-primary btn-md" id="adminSavePlotsBtn">Save</button>
      </div>
      <div class="viewport-container">
        <div class="camera-stage"><div class="camera-feed-wrapper"><canvas id="adminCameraCanvas" width="800" height="450"></canvas></div></div>
        <aside class="inspector-panel">
          <div>
            <div class="inspector-title" id="adminInspectorTitle">No spot selected</div>
            <div class="form-group"><label for="adminPlotId">Spot name</label><input type="text" id="adminPlotId" class="form-control" disabled></div>
            <div class="form-group"><label for="adminPlotType">Type</label><select id="adminPlotType" class="form-control" disabled><option value="standard">Standard</option><option value="ev">EV charging</option><option value="disabled">Accessible</option></select></div>
            <div class="form-group"><label for="adminPlotStatus">Status</label><select id="adminPlotStatus" class="form-control" disabled><option value="available">Free</option><option value="occupied">Occupied</option></select></div>
            <div class="stack"><button class="btn btn-secondary btn-md btn-block" id="adminToggleOccupancyBtn" disabled>Test occupancy</button><button class="btn btn-danger btn-md btn-block" id="adminDeletePlotBtn" disabled>Delete spot</button></div>
          </div>
          <div>
            <div class="inspector-title">Camera address</div>
            <input type="text" id="adminCameraUrl" class="form-control" placeholder="rtsp://camera.example/live" aria-label="Camera address">
            <button class="btn btn-secondary btn-md btn-block" id="adminCaptureFrameBtn" style="margin-top:8px">Capture a live frame</button>
            <div id="adminCaptureStatus" class="muted" style="font-size:13px;margin-top:6px"></div>
          </div>
        </aside>
      </div>`;
  },
  mount(ctx, showToast) {
    const $ = (id) => document.getElementById(id);
    adminCanvas = new CameraCanvas($('adminCameraCanvas'), { onPlotSelected: (plot) => updateInspector(plot), onPlotsChanged: () => {} });
    const camUrl = $('adminCameraUrl');
    let loaded = [];
    fetchLots().then((lots) => {
      loaded = lots;
      if (lots.length) { adminCanvas?.setLot(lots[0]); camUrl.value = lots[0].camera_url || ''; }
      $('adminLotSelect')?.addEventListener('change', (e) => {
        const l = lots.find((x) => x.id === e.target.value);
        if (l) { adminCanvas?.setLot(l); camUrl.value = l.camera_url || ''; }
      });
    });
    const status = $('adminCaptureStatus');
    $('adminCaptureFrameBtn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      status.textContent = 'Capturing a frame from the camera…';
      try {
        const res = await captureCameraFrame(camUrl.value.trim() || 'rtsp://cam.timisoara-hub.ro/live');
        if (res?.image) { adminCanvas.setBackgroundImage(res.image); status.textContent = 'Frame captured. You can mark the spots now.'; }
        else status.textContent = 'The camera did not return a picture.';
      } catch (err) {
        status.textContent = `Could not capture: ${err.message}`;
      } finally {
        btn.disabled = false;
      }
    });
    const setMode = (m) => {
      adminCanvas.setMode(m);
      $('adminSelectModeBtn').classList.toggle('btn-active', m === 'select');
      $('adminDrawModeBtn').classList.toggle('btn-active', m === 'draw');
    };
    $('adminSelectModeBtn').addEventListener('click', () => setMode('select'));
    $('adminDrawModeBtn').addEventListener('click', () => setMode('draw'));
    $('adminAddGridBtn').addEventListener('click', () => adminCanvas.addGridSlots(5));
    $('adminSavePlotsBtn').addEventListener('click', async () => {
      const plots = adminCanvas.getPlots();
      try {
        await saveLotPlots($('adminLotSelect').value, { slots_data: plots, camera_url: $('adminCameraUrl').value.trim() || null, capacity: plots.length || undefined });
        showToast?.(`Saved ${plots.length} spots for ${loaded.find((l) => l.id === $('adminLotSelect').value)?.name || 'this lot'}. The vision agent will scan this camera.`);
      } catch (err) {
        showToast?.(`Could not save: ${err.message}`);
      }
    });
    $('adminPlotId').addEventListener('input', (e) => adminCanvas.updateSelectedPlot({ id: e.target.value }));
    $('adminPlotType').addEventListener('change', (e) => adminCanvas.updateSelectedPlot({ type: e.target.value }));
    $('adminPlotStatus').addEventListener('change', (e) => adminCanvas.updateSelectedPlot({ status: e.target.value }));
    $('adminToggleOccupancyBtn').addEventListener('click', () => {
      const plot = adminCanvas.getSelectedPlot();
      if (!plot) return;
      const next = plot.status === 'occupied' ? 'available' : 'occupied';
      adminCanvas.updateSelectedPlot({ status: next });
      $('adminPlotStatus').value = next;
    });
    $('adminDeletePlotBtn').addEventListener('click', () => adminCanvas.deleteSelectedPlot());
  },
};

function updateInspector(plot) {
  const $ = (id) => document.getElementById(id);
  const on = !!plot;
  $('adminInspectorTitle').textContent = on ? `Editing ${plot.id}` : 'No spot selected';
  $('adminPlotId').value = on ? plot.id : '';
  $('adminPlotType').value = on ? plot.type || 'standard' : 'standard';
  $('adminPlotStatus').value = on ? plot.status || 'available' : 'available';
  for (const id of ['adminPlotId', 'adminPlotType', 'adminPlotStatus', 'adminToggleOccupancyBtn', 'adminDeletePlotBtn']) $(id).disabled = !on;
}

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
