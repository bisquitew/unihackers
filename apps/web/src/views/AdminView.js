import { getCurrentToken, hasMfa, switchToken } from '../auth.js';
import { createOutage, fetchAuditLogs, fetchLots, fetchTigerStatus, saveLotPlots } from '../api.js';
import { CameraCanvas } from '../components/CameraCanvas.js';
import { esc } from '../ui.js';

let adminCanvas = null;

/** The staff dashboard: parking camera calibration, publishing outages, the security log and the database status. */
export async function render(ctx) {
  const mfa = hasMfa();
  const [lots, auditLogs, tiger] = await Promise.all([fetchLots(), fetchAuditLogs(8), fetchTigerStatus()]);

  return `<div class="page wide">
    <div style="margin-bottom:28px">
      <h1 class="page-title">Staff dashboard</h1>
      <p class="page-sub">Signed in as ${esc(ctx.user.name)}. These tools are only available to city staff, on the website.</p>
    </div>

    <div class="admin-subnav" role="tablist">
      <button class="admin-sublink active" role="tab" data-subtab="parkie-calib">Parking cameras</button>
      <button class="admin-sublink" role="tab" data-subtab="outages-mfa">Publish an outage</button>
      <button class="admin-sublink" role="tab" data-subtab="audit-logs">Security log</button>
      <button class="admin-sublink" role="tab" data-subtab="tiger-db">Database</button>
    </div>

    <div class="admin-subcontent" id="subtab-parkie-calib">
      <div class="workspace-toolbar">
        <div class="toolbar-group">
          <select id="adminLotSelect" class="form-control" style="width:260px" aria-label="Parking lot">
            ${lots.map((l) => `<option value="${esc(l.id)}">${esc(l.name)} (${l.available_spots}/${l.capacity})</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-md btn-active" id="adminSelectModeBtn">Select</button>
          <button class="btn btn-secondary btn-md" id="adminDrawModeBtn">Draw a spot</button>
          <button class="btn btn-secondary btn-md" id="adminAddGridBtn">Add 5 in a grid</button>
        </div>
        <button class="btn btn-primary btn-md" id="adminSavePlotsBtn">Save and calibrate</button>
      </div>

      <div class="viewport-container">
        <div class="camera-stage">
          <div class="camera-feed-wrapper">
            <canvas id="adminCameraCanvas" width="800" height="450"></canvas>
          </div>
        </div>
        <aside class="inspector-panel">
          <div>
            <div class="inspector-title" id="adminInspectorTitle">No spot selected</div>
            <div class="form-group"><label for="adminPlotId">Spot ID</label><input type="text" id="adminPlotId" class="form-control" disabled></div>
            <div class="form-group"><label for="adminPlotType">Type</label>
              <select id="adminPlotType" class="form-control" disabled>
                <option value="standard">Standard</option><option value="ev">EV charging</option><option value="disabled">Accessible</option>
              </select></div>
            <div class="form-group"><label for="adminPlotStatus">Status</label>
              <select id="adminPlotStatus" class="form-control" disabled>
                <option value="available">Free</option><option value="occupied">Occupied</option>
              </select></div>
            <div class="stack">
              <button class="btn btn-secondary btn-md btn-block" id="adminToggleOccupancyBtn" disabled>Test occupancy</button>
              <button class="btn btn-danger btn-md btn-block" id="adminDeletePlotBtn" disabled>Delete spot</button>
            </div>
          </div>
          <div>
            <div class="inspector-title">Camera source</div>
            <input type="text" id="adminCameraUrl" class="form-control" placeholder="rtsp://cam.timisoara-hub.ro/live" aria-label="RTSP camera URL">
          </div>
        </aside>
      </div>
    </div>

    <div class="admin-subcontent" id="subtab-outages-mfa" style="display:none">
      <div class="form-panel-card">
        <div class="panel-header">
          <h3>Publish an outage</h3>
          <p>A high-privilege action. It needs a second check (step-up MFA, RFC 9470); without it the server answers with a challenge.</p>
        </div>
        <div class="mfa-status-banner ${mfa ? 'banner-verified' : 'banner-warning'}">
          <span>${mfa ? 'Second check done for this session.' : 'No second check yet. Publishing will ask for one.'}</span>
          ${!mfa ? '<button class="btn btn-secondary btn-sm" id="upgradeMfaPasskeyBtn">Verify with passkey</button>' : ''}
        </div>
        <div class="stack">
          <label class="field"><span>Title</span><input id="newOutageTitle" value="Colterm: main pipe works on Circumvalațiunii"></label>
          <label class="field"><span>Operator</span><select id="newOutageProvider"><option value="Colterm">Colterm (heating and hot water)</option><option value="Aquatim">Aquatim (water and sewage)</option></select></label>
          <label class="field"><span>Affected areas, separated by commas</span><input id="newOutageAreas" value="Circumvalatiunii, Mehala"></label>
          <label class="field"><span>Details</span><textarea id="newOutageDesc" rows="3">Unplanned failure on the primary network. Repair crews are on site.</textarea></label>
          <div><button class="btn btn-primary" id="publishOutageBtn">Publish outage</button></div>
          <div id="outagePublishResult" class="result" hidden></div>
        </div>
      </div>
    </div>

    <div class="admin-subcontent" id="subtab-audit-logs" style="display:none">
      <div class="form-panel-card" style="max-width:none">
        <div class="panel-header"><h3>Security log</h3><p>Every authorization decision, MFA challenge and privileged access, kept in the audit table.</p></div>
        <div class="list">
          ${(auditLogs.logs || []).map((log) => `
            <div class="audit-row">
              <span class="audit-badge ${log.decision === 'allow' ? 'badge-allow' : 'badge-challenge'}">${esc((log.decision || 'allow').toUpperCase())}</span>
              <div class="audit-details">
                <div><strong>${esc(log.action)}</strong></div>
                <div class="audit-meta">User <code>${esc(log.user_id)}</code> · role ${esc(log.role)} · MFA ${log.mfa_verified ? 'yes' : 'no'} · IP ${esc(log.ip_address)}</div>
              </div>
              <div class="audit-time">${new Date(log.created_at).toLocaleTimeString()}</div>
            </div>`).join('') || '<div class="empty">No events yet.</div>'}
        </div>
      </div>
    </div>

    <div class="admin-subcontent" id="subtab-tiger-db" style="display:none">
      <div class="form-panel-card">
        <div class="panel-header"><h3>Database status</h3><p>Time-series database for sensors, parking cameras and audit events (TimescaleDB ${esc(tiger?.version || '2.x')}).</p></div>
        <div class="tiger-grid">
          <div><div class="muted">Host</div><div><code>${esc(tiger?.host || 'tsdb.cloud.timescale.com')}</code></div></div>
          <div><div class="muted">Hypertables</div><div><strong>${tiger?.hypertables?.length || 3}</strong> partitioned tables</div></div>
          <div><div class="muted">Continuous aggregates</div><div><strong>${tiger?.continuous_aggregates?.length || 2}</strong> materialized views</div></div>
        </div>
      </div>
    </div>
  </div>`;
}

export async function mount(ctx, { showToast } = {}) {
  const lots = await fetchLots();

  document.querySelectorAll('.admin-sublink').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-sublink').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.admin-subcontent').forEach((c) => { c.style.display = 'none'; });
      btn.classList.add('active');
      const content = document.getElementById(`subtab-${btn.dataset.subtab}`);
      if (content) content.style.display = 'block';
    });
  });

  const canvasEl = document.getElementById('adminCameraCanvas');
  if (canvasEl) {
    adminCanvas = new CameraCanvas(canvasEl, { onPlotSelected: (plot) => updateInspector(plot), onPlotsChanged: () => {} });
    const lotSelect = document.getElementById('adminLotSelect');
    if (lots.length) adminCanvas.setLot(lots[0]);
    lotSelect?.addEventListener('change', (e) => {
      const selected = lots.find((l) => l.id === e.target.value);
      if (selected) adminCanvas.setLot(selected);
    });
    const modeBtns = { select: document.getElementById('adminSelectModeBtn'), draw: document.getElementById('adminDrawModeBtn') };
    const setMode = (m) => {
      adminCanvas.setMode(m);
      modeBtns.select?.classList.toggle('btn-active', m === 'select');
      modeBtns.draw?.classList.toggle('btn-active', m === 'draw');
    };
    modeBtns.select?.addEventListener('click', () => setMode('select'));
    modeBtns.draw?.addEventListener('click', () => setMode('draw'));
    document.getElementById('adminAddGridBtn')?.addEventListener('click', () => adminCanvas.addGridSlots(5));
    document.getElementById('adminSavePlotsBtn')?.addEventListener('click', async () => {
      const plots = adminCanvas.getPlots();
      try {
        await saveLotPlots(lotSelect.value, { slots_data: plots, camera_url: document.getElementById('adminCameraUrl').value.trim() || null, capacity: plots.length });
        showToast?.(`Saved. ${plots.length} spots configured.`);
      } catch (err) {
        showToast?.(`Could not save: ${err.message}`);
      }
    });
    document.getElementById('adminPlotId')?.addEventListener('input', (e) => adminCanvas.updateSelectedPlot({ id: e.target.value }));
    document.getElementById('adminPlotType')?.addEventListener('change', (e) => adminCanvas.updateSelectedPlot({ type: e.target.value }));
    document.getElementById('adminPlotStatus')?.addEventListener('change', (e) => adminCanvas.updateSelectedPlot({ status: e.target.value }));
    document.getElementById('adminToggleOccupancyBtn')?.addEventListener('click', () => {
      const plot = adminCanvas.getSelectedPlot();
      if (!plot) return;
      const next = plot.status === 'occupied' ? 'available' : 'occupied';
      adminCanvas.updateSelectedPlot({ status: next });
      document.getElementById('adminPlotStatus').value = next;
    });
    document.getElementById('adminDeletePlotBtn')?.addEventListener('click', () => adminCanvas.deleteSelectedPlot());
  }

  document.getElementById('upgradeMfaPasskeyBtn')?.addEventListener('click', async () => { await switchToken('dev_admin_mfa'); });

  document.getElementById('publishOutageBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('publishOutageBtn');
    const out = document.getElementById('outagePublishResult');
    btn.disabled = true;
    out.hidden = false;
    try {
      const created = await createOutage(getCurrentToken(), {
        title: document.getElementById('newOutageTitle').value,
        provider: document.getElementById('newOutageProvider').value,
        affected_areas: document.getElementById('newOutageAreas').value.split(',').map((s) => s.trim()),
        description: document.getElementById('newOutageDesc').value,
      });
      out.innerHTML = `<b class="ok">Published.</b><p style="margin-top:4px">Outage <code>${esc(created.id)}</code> is live for residents.</p>`;
    } catch (err) {
      if (err.status === 403 && String(err.message).includes('MFA')) {
        out.innerHTML = `<b class="bad">A second check is needed.</b><p style="margin:4px 0 10px">${esc(err.message)}</p><button class="btn btn-secondary btn-sm" id="stepUpNowBtn">Verify with passkey</button>`;
        document.getElementById('stepUpNowBtn')?.addEventListener('click', async () => { await switchToken('dev_admin_mfa'); });
      } else {
        out.innerHTML = `<b class="bad">Could not publish.</b><p style="margin-top:4px">${esc(err.message)}</p>`;
      }
    } finally {
      btn.disabled = false;
    }
  });

  return () => { adminCanvas = null; };
}

function updateInspector(plot) {
  const $ = (id) => document.getElementById(id);
  const on = !!plot;
  $('adminInspectorTitle').textContent = on ? `Editing ${plot.id}` : 'No spot selected';
  $('adminPlotId').value = on ? plot.id : '';
  $('adminPlotType').value = on ? plot.type || 'standard' : 'standard';
  $('adminPlotStatus').value = on ? plot.status || 'available' : 'available';
  for (const id of ['adminPlotId', 'adminPlotType', 'adminPlotStatus', 'adminToggleOccupancyBtn', 'adminDeletePlotBtn']) $(id).disabled = !on;
}
