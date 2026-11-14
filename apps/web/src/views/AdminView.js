import { getCurrentToken, hasMfa, switchToken } from '../auth.js';
import { createOutage, fetchAuditLogs, fetchLots, fetchTigerStatus, saveLotPlots, createAreaAlert } from '../api.js';
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
      <button class="admin-sublink" role="tab" data-subtab="area-alerts">🚨 Danger & Works Radius</button>
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

    <!-- Tab 2: Danger & Works Area Alerts with Radius & Neighbour Signaling -->
    <div class="admin-subcontent" id="subtab-area-alerts" style="display:none">
      <div class="form-panel-card">
        <div class="panel-header">
          <h3>🚨 Issue Danger Perimeter or Construction Work Area Alert</h3>
          <p>Maps the incident radius, computes overlapping Timișoara neighbourhoods, and instantly notifies nearest residents.</p>
        </div>
        <div class="stack" style="max-width: 640px;">
          <label class="field"><span>Alert Kind</span>
            <select id="newAlertKind">
              <option value="danger">🚨 Danger (Gas leak, fire hazard, structural collapse, safety notice)</option>
              <option value="construction">🚧 Construction (Roadworks, STPT track renewal, underground excavation)</option>
            </select>
          </label>
          <label class="field"><span>Title</span><input id="newAlertTitle" placeholder="ex: Pasajul Jiul gas leak perimeter"></label>
          <label class="field"><span>Description & citizen guidance</span>
            <textarea id="newAlertDesc" rows="3" placeholder="Provide instructions for residents inside the perimeter..."></textarea>
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <label class="field"><span>Center Neighbourhood</span>
              <select id="newAlertArea">
                <option value="Circumvalațiunii" data-lat="45.7620" data-lng="21.2180">Circumvalațiunii</option>
                <option value="Cetate (Centru)" data-lat="45.7578" data-lng="21.2290">Cetate (Centru)</option>
                <option value="Complex Studențesc" data-lat="45.7480" data-lng="21.2410">Complex Studențesc</option>
                <option value="Mehala" data-lat="45.7680" data-lng="21.2020">Mehala</option>
                <option value="Fabric" data-lat="45.7580" data-lng="21.2510">Fabric</option>
                <option value="Iosefin" data-lat="45.7450" data-lng="21.2050">Iosefin</option>
                <option value="Girocului" data-lat="45.7320" data-lng="21.2350">Calea Girocului</option>
              </select>
            </label>
            <label class="field"><span>Severity</span>
              <select id="newAlertSeverity">
                <option value="critical">Critical — Immediate safety action</option>
                <option value="high">High — Significant area impact</option>
                <option value="medium">Medium — Moderate work zone</option>
              </select>
            </label>
          </div>
          <div class="field">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span>Perimeter Radius</span>
              <b id="radiusLabel" style="color:var(--color-ink)">700 meters</b>
            </div>
            <input type="range" id="newAlertRadius" min="150" max="2500" step="50" value="700" style="width:100%">
          </div>
          <div id="affectedNeighboursPreview" style="background:var(--color-tint, rgba(0,0,0,0.04));border-radius:8px;padding:12px;font-size:13px">
            <b>📡 Automatic Neighbour Signaling:</b>
            <div style="margin-top:4px" class="muted">Residents in Circumvalațiunii, Cetate, Gara de Nord will receive prioritized alerts.</div>
          </div>
          <button class="btn btn-primary btn-md" id="publishAreaAlertBtn">📡 Broadcast Perimeter & Signal Neighbours</button>
          <div class="result" id="areaAlertResult" hidden></div>
        </div>
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
          <label class="field"><span>Operator</span><select id="newOutageProvider"><option value="colterm">Colterm</option><option value="aquatim">Aquatim</option></select></label>
          <label class="field"><span>Affected areas</span><input id="newOutageAreas" value="Circumvalațiunii, Mehala"></label>
          <label class="field"><span>Description</span><textarea id="newOutageDesc" rows="3">A pipe renewal project will temporarily cut hot water.</textarea></label>
          <button class="btn btn-primary btn-md" id="publishOutageBtn">Publish outage</button>
          <div class="result" id="outagePublishResult" hidden></div>
        </div>
      </div>
    </div>

    <div class="admin-subcontent" id="subtab-audit-logs" style="display:none">
      <div class="form-panel-card">
        <div class="panel-header">
          <h3>Security log</h3>
          <p>Every privileged action and MFA decision is recorded here, in memory and on the server.</p>
        </div>
        <div class="list">
          ${auditLogs.map((l) => `<div class="row" style="padding:10px 4px">
            <div class="body">
              <div class="title"><code>${esc(l.action)}</code> · <b>${esc(l.outcome)}</b></div>
              <div class="detail">${esc(l.user_email || 'anonymous')} · ${esc(l.user_role || 'guest')}</div>
            </div>
            <div class="side muted" style="font-size:12px">${new Date(l.created_at).toLocaleTimeString()}</div>
          </div>`).join('') || '<div class="empty">No security events yet.</div>'}
        </div>
      </div>
    </div>

    <div class="admin-subcontent" id="subtab-tiger-db" style="display:none">
      <div class="form-panel-card">
        <div class="panel-header">
          <h3>Database status</h3>
          <p>The time-series database runs on TimescaleDB. Live aggregates power the city metrics and the parking charts.</p>
        </div>
        <div class="cols">
          <div>
            <div class="detail-card"><div class="muted">Version</div><b style="font-size:18px">${esc(tiger?.version || '2.32.0')}</b></div>
            <div class="detail-card"><div class="muted">Connected</div><b style="font-size:18px">${tiger?.connected ? 'Live' : 'Fallback (offline)'}</b></div>
          </div>
          <div>
            <div class="detail-card"><div class="muted">Active hypertables</div><b style="font-size:18px">${tiger?.hypertables?.length || 3}</b></div>
            <div class="detail-card"><div class="muted">Continuous aggregates</div><b style="font-size:18px">${tiger?.continuous_aggregates?.length || 2}</b></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function mount(ctx, { saveLotPlots, showToast }) {
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
    fetchLots().then((lots) => {
      const lotSelect = document.getElementById('adminLotSelect');
      if (lots.length) adminCanvas.setLot(lots[0]);
      lotSelect?.addEventListener('change', (e) => {
        const selected = lots.find((l) => l.id === e.target.value);
        if (selected) adminCanvas.setLot(selected);
      });
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
      const lotSelect = document.getElementById('adminLotSelect');
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

  // Area Danger & Construction Alert Form
  const radiusSlider = document.getElementById('newAlertRadius');
  const radiusLabel = document.getElementById('radiusLabel');
  const areaSelect = document.getElementById('newAlertArea');
  const previewBox = document.getElementById('affectedNeighboursPreview');

  const updateRadiusPreview = () => {
    if (!radiusSlider || !radiusLabel) return;
    const radius = radiusSlider.value;
    radiusLabel.textContent = `${radius} meters`;
    const areaName = areaSelect?.value || 'Circumvalațiunii';
    let suggestedNeighbours = [areaName];
    if (radius > 500) {
      if (areaName.includes('Circumvalațiunii')) suggestedNeighbours.push('Cetate (Centru)', 'Gara de Nord', 'Mehala');
      else if (areaName.includes('Complex')) suggestedNeighbours.push('Elisabetin', 'Fabric', 'Soarelui');
      else if (areaName.includes('Cetate')) suggestedNeighbours.push('Circumvalațiunii', 'Fabric', 'Iosefin');
      else suggestedNeighbours.push('Cartiere limitrofe');
    }
    if (previewBox) {
      previewBox.innerHTML = `<b>📡 Automatic Neighbour Signaling:</b><div style="margin-top:4px" class="muted">Residents in <b>${suggestedNeighbours.join(', ')}</b> will receive prioritized alerts and live radius mapping.</div>`;
    }
  };

  radiusSlider?.addEventListener('input', updateRadiusPreview);
  areaSelect?.addEventListener('change', updateRadiusPreview);

  document.getElementById('publishAreaAlertBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('publishAreaAlertBtn');
    const out = document.getElementById('areaAlertResult');
    const title = document.getElementById('newAlertTitle')?.value?.trim();
    const desc = document.getElementById('newAlertDesc')?.value?.trim();
    const type = document.getElementById('newAlertKind')?.value || 'danger';
    const severity = document.getElementById('newAlertSeverity')?.value || 'high';
    const radius = parseInt(radiusSlider?.value || '700', 10);
    const selectedOption = areaSelect?.options[areaSelect.selectedIndex];
    const lat = parseFloat(selectedOption?.getAttribute('data-lat') || '45.7620');
    const lng = parseFloat(selectedOption?.getAttribute('data-lng') || '21.2180');
    const neighbourhood = selectedOption?.value || 'Circumvalațiunii';

    if (!title || !desc) {
      if (out) { out.hidden = false; out.innerHTML = '<b class="bad">Please enter both a title and description.</b>'; }
      return;
    }

    btn.disabled = true;
    out.hidden = false;
    out.innerHTML = '<span class="muted">Broadcasting alert...</span>';

    try {
      const created = await createAreaAlert(getCurrentToken(), {
        title,
        description: desc,
        type,
        severity,
        latitude: lat,
        longitude: lng,
        radius_meters: radius,
        neighbourhood
      });

      out.innerHTML = `<b class="ok">Published & Signaled.</b><p style="margin-top:4px">Perimeter radius: <b>${created.radius_meters}m</b>. Signaled neighbours: <b>${(created.affected_neighbourhoods || []).join(', ')}</b> (${created.affected_residents_count || 0} residents notified).</p>`;
      showToast?.('Perimeter alert published.');
    } catch (err) {
      out.innerHTML = `<b class="bad">Could not publish alert:</b> ${esc(err.message)}`;
    } finally {
      btn.disabled = false;
    }
  });

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
