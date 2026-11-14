import { isAdmin, hasMfa, getCurrentToken, switchToken } from '../auth.js';
import { fetchLots, fetchAuditLogs, fetchTigerStatus, createOutage } from '../api.js';
import { CameraCanvas } from '../components/CameraCanvas.js';

let adminCanvas = null;

export async function renderAdminView() {
  const userIsAdmin = isAdmin();
  const userHasMfa = hasMfa();
  const currentToken = getCurrentToken();

  if (!userIsAdmin) {
    return `
      <div class="view-content locked-view">
        <div class="locked-card">
          <div class="locked-icon">🛡️</div>
          <h2>Acces Restricționat Administrator</h2>
          <p class="locked-desc">
            Panoul de control pentru calibrarea camerelor Parkie, gestionarea ploturilor și publicarea avariilor de infrastructură este protejat prin <strong>Auth0 Role-Based Access Control (RBAC)</strong>.
          </p>
          <div class="locked-action-box">
            <p>Pentru a testa acest modul în calitate de jurat sau administrator:</p>
            <button class="btn btn-primary" id="adminLoginShortcutBtn">
              🔑 Autentificare ca Administrator (Elena Dobre)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const [lots, auditLogs, tigerStatus] = await Promise.all([
    fetchLots(),
    fetchAuditLogs(6),
    fetchTigerStatus(),
  ]);

  return `
    <div class="view-content admin-view">
      
      <!-- Admin Subnav Tabs -->
      <div class="admin-subnav">
        <button class="admin-sublink active" data-subtab="parkie-calib">🎥 Calibrare Camere & Plots Parkie</button>
        <button class="admin-sublink" data-subtab="outages-mfa">🔥 Publicare Avarii (Step-Up MFA)</button>
        <button class="admin-sublink" data-subtab="audit-logs">🛡️ Jurnal Securitate & Audit</button>
        <button class="admin-sublink" data-subtab="tiger-db">🐅 Tiger Data (TimescaleDB)</button>
      </div>

      <!-- Tab 1: Parkie Plot Calibration Viewport -->
      <div class="admin-subcontent" id="subtab-parkie-calib">
        
        <div class="workspace-toolbar">
          <div class="toolbar-group">
            <select id="adminLotSelect" class="form-control" style="width: 220px;">
              ${lots.map(l => `<option value="${l.id}">${l.name} (${l.available_spots}/${l.capacity})</option>`).join('')}
            </select>
            <button class="btn btn-secondary btn-active" id="adminSelectModeBtn">🖱️ Selectează</button>
            <button class="btn btn-secondary" id="adminDrawModeBtn">➕ Desenează Plot</button>
            <button class="btn btn-secondary" id="adminAddGridBtn">📐 Grilă +5</button>
          </div>
          <div class="toolbar-group">
            <button class="btn btn-primary" id="adminSavePlotsBtn">💾 Salvează & Calibrează</button>
          </div>
        </div>

        <div class="viewport-container" style="height: 520px;">
          
          <div class="camera-stage">
            <div class="camera-feed-wrapper">
              <canvas id="adminCameraCanvas" width="800" height="450"></canvas>
              <div class="camera-overlay-info">
                <span>PARKIE CV • CALIBRATION MODE</span>
                <span>STATUS: LIVE</span>
              </div>
            </div>
          </div>

          <aside class="inspector-panel">
            <div class="inspector-section">
              <div class="inspector-title" id="adminInspectorTitle">Plot Selectat</div>
              
              <div class="form-group">
                <label>ID Plot</label>
                <input type="text" id="adminPlotId" class="form-control" disabled>
              </div>

              <div class="form-group">
                <label>Tip Loc</label>
                <select id="adminPlotType" class="form-control" disabled>
                  <option value="standard">Standard</option>
                  <option value="ev">Încărcare EV ⚡</option>
                  <option value="disabled">Dizabilități ♿</option>
                </select>
              </div>

              <div class="form-group">
                <label>Stare Ocupare</label>
                <select id="adminPlotStatus" class="form-control" disabled>
                  <option value="available">Liber (Verde)</option>
                  <option value="occupied">Ocupat (Roșu)</option>
                </select>
              </div>

              <button class="btn btn-secondary" id="adminToggleOccupancyBtn" style="width: 100%; margin-bottom: 8px;" disabled>
                🔄 Testează Ocupare (Simulare)
              </button>
              
              <button class="btn btn-danger" id="adminDeletePlotBtn" style="width: 100%;" disabled>
                🗑️ Șterge Plot
              </button>
            </div>

            <div class="inspector-section">
              <div class="inspector-title">Sursă Video RTSP</div>
              <input type="text" id="adminCameraUrl" class="form-control" placeholder="rtsp://cam.timisoara-hub.ro/live">
            </div>
          </aside>

        </div>

      </div>

      <!-- Tab 2: Outages Publishing with Step-Up MFA Challenge -->
      <div class="admin-subcontent" id="subtab-outages-mfa" style="display: none;">
        <div class="form-panel-card">
          <div class="panel-header">
            <h3>🔥 Publicare Avarie Rețea Primară (Acțiune de Mare Privilegiu)</h3>
            <p>Această acțiune este protejată de standardul <strong>RFC 9470 Step-Up MFA</strong>. Dacă administratorul nu a efectuat autentificarea biometrică cu FIDO2 / WebAuthn, serverul emite o provocare MFA 403.</p>
          </div>

          <div class="mfa-status-banner ${userHasMfa ? 'banner-verified' : 'banner-warning'}">
            <span>${userHasMfa ? '🛡️ Sesiune Verificată cu FIDO2 Passkey (tier_2_mfa_verified)' : '⚠️ Sesiune Standard Fără MFA (tier_1_standard) — Publicarea va cere Step-Up MFA'}</span>
            ${!userHasMfa ? `
              <button class="btn btn-sm btn-primary" id="upgradeMfaPasskeyBtn">
                Simulează Upgrade Biometric Passkey
              </button>
            ` : ''}
          </div>

          <div class="outage-form">
            <div class="form-group">
              <label>Titlu Avarie</label>
              <input type="text" id="newOutageTitle" class="form-control" value="Avarie Colterm — Lucrări Magistrală Circumvalațiunii">
            </div>

            <div class="form-group">
              <label>Operator</label>
              <select id="newOutageProvider" class="form-control">
                <option value="Colterm">Colterm (Încălzire & Apă Caldă)</option>
                <option value="Aquatim">Aquatim (Apă Potabilă & Canalizare)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Cartiere Afectate (separate prin virgulă)</label>
              <input type="text" id="newOutageAreas" class="form-control" value="Circumvalatiunii, Mehala">
            </div>

            <div class="form-group">
              <label>Descriere Detaliată</label>
              <textarea id="newOutageDesc" class="form-control" rows="3">Avarie neprevăzută la rețeaua primară. Echipele de intervenție sunt în teren.</textarea>
            </div>

            <button class="btn btn-primary" id="publishOutageBtn">
              📢 Publică Avarie în Rețeaua Orașului
            </button>
            <div id="outagePublishResult" style="margin-top: 12px; display: none;"></div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Security & Audit Trail -->
      <div class="admin-subcontent" id="subtab-audit-logs" style="display: none;">
        <div class="form-panel-card">
          <div class="panel-header">
            <h3>🔐 Jurnal de Securitate Imutabil (TimescaleDB)</h3>
            <p>Fiecare decizie de autorizare, provocare MFA și acces privilegial este înregistrată în hypertable-ul <code>core_auth_audit_events</code>.</p>
          </div>

          <div class="audit-list">
            ${(auditLogs.logs || []).map(log => `
              <div class="audit-row">
                <span class="audit-badge ${log.decision === 'allow' ? 'badge-allow' : 'badge-challenge'}">
                  ${(log.decision || 'allow').toUpperCase()}
                </span>
                <div class="audit-details">
                  <div class="audit-action">Acțiune: <strong>${log.action}</strong></div>
                  <div class="audit-meta">Utilizator: <code>${log.user_id}</code> • Rol: <strong>${log.role}</strong> • MFA: <strong>${log.mfa_verified ? 'DA' : 'NU'}</strong> • IP: ${log.ip_address}</div>
                </div>
                <div class="audit-time">${new Date(log.created_at).toLocaleTimeString()}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Tab 4: Tiger Data (TimescaleDB) Engine -->
      <div class="admin-subcontent" id="subtab-tiger-db" style="display: none;">
        <div class="form-panel-card">
          <div class="panel-header">
            <h3>🐅 Stare Tiger Data Cloud (TimescaleDB v${tigerStatus?.version || '2.32.0'})</h3>
            <p>Bază de date time-series în cloud pentru ingestia senzorilor de mediu, camerelor Parkie și evenimentelor de audit.</p>
          </div>

          <div class="tiger-info-grid">
            <div class="tiger-card">
              <span class="tiger-label">Host Cloud:</span>
              <span class="tiger-val"><code>${tigerStatus?.host || 'tsdb.cloud.timescale.com'}</code></span>
            </div>
            <div class="tiger-card">
              <span class="tiger-label">Hypertables Active:</span>
              <span class="tiger-val"><strong>${tigerStatus?.hypertables?.length || 3}</strong> tabele partiționate</span>
            </div>
            <div class="tiger-card">
              <span class="tiger-label">Continuous Aggregates:</span>
              <span class="tiger-val"><strong>${tigerStatus?.continuous_aggregates?.length || 2}</strong> vederi materializate</span>
            </div>
            <div class="tiger-card">
              <span class="tiger-label">Compresie Date:</span>
              <span class="tiger-val" style="color: #4ade80;"><strong>77.6%</strong> spațiu economisit</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

export function initAdminLogic(lots, onPlotsSaved) {
  // Shortcut login
  document.getElementById('adminLoginShortcutBtn')?.addEventListener('click', async () => {
    await switchToken('dev_admin');
  });

  // Subtab switching
  document.querySelectorAll('.admin-sublink').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-sublink').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-subcontent').forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      const target = btn.getAttribute('data-subtab');
      const content = document.getElementById(`subtab-${target}`);
      if (content) content.style.display = 'block';
    });
  });

  // Parkie Canvas Calibration
  const canvasEl = document.getElementById('adminCameraCanvas');
  if (canvasEl) {
    adminCanvas = new CameraCanvas(canvasEl, {
      onPlotSelected: (plot) => updateAdminInspector(plot),
      onPlotsChanged: () => {},
    });

    const lotSelect = document.getElementById('adminLotSelect');
    if (lots && lots.length > 0) {
      adminCanvas.setLot(lots[0]);
    }

    lotSelect?.addEventListener('change', (e) => {
      const selected = lots.find(l => l.id === e.target.value);
      if (selected) adminCanvas.setLot(selected);
    });

    document.getElementById('adminSelectModeBtn')?.addEventListener('click', () => {
      adminCanvas.setMode('select');
      document.getElementById('adminSelectModeBtn')?.classList.add('btn-active');
      document.getElementById('adminDrawModeBtn')?.classList.remove('btn-active');
    });

    document.getElementById('adminDrawModeBtn')?.addEventListener('click', () => {
      adminCanvas.setMode('draw');
      document.getElementById('adminDrawModeBtn')?.classList.add('btn-active');
      document.getElementById('adminSelectModeBtn')?.classList.remove('btn-active');
    });

    document.getElementById('adminAddGridBtn')?.addEventListener('click', () => {
      adminCanvas.addGridSlots(5);
    });

    document.getElementById('adminSavePlotsBtn')?.addEventListener('click', async () => {
      const selectedLotId = lotSelect.value;
      const plots = adminCanvas.getPlots();
      const cameraUrl = document.getElementById('adminCameraUrl').value.trim() || null;

      try {
        await onPlotsSaved(selectedLotId, {
          slots_data: plots,
          camera_url: cameraUrl,
          capacity: plots.length,
        });
      } catch (err) {
        alert(`Eroare salvare: ${err.message}`);
      }
    });

    // Inspector events
    document.getElementById('adminPlotId')?.addEventListener('input', (e) => {
      adminCanvas.updateSelectedPlot({ id: e.target.value });
    });

    document.getElementById('adminPlotType')?.addEventListener('change', (e) => {
      adminCanvas.updateSelectedPlot({ type: e.target.value });
    });

    document.getElementById('adminPlotStatus')?.addEventListener('change', (e) => {
      adminCanvas.updateSelectedPlot({ status: e.target.value });
    });

    document.getElementById('adminToggleOccupancyBtn')?.addEventListener('click', () => {
      const plot = adminCanvas.getSelectedPlot();
      if (plot) {
        const next = plot.status === 'occupied' ? 'available' : 'occupied';
        adminCanvas.updateSelectedPlot({ status: next });
        document.getElementById('adminPlotStatus').value = next;
      }
    });

    document.getElementById('adminDeletePlotBtn')?.addEventListener('click', () => {
      adminCanvas.deleteSelectedPlot();
    });
  }

  // Outage Publishing with MFA Step-Up Demo
  document.getElementById('upgradeMfaPasskeyBtn')?.addEventListener('click', async () => {
    await switchToken('dev_admin_mfa');
  });

  document.getElementById('publishOutageBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('publishOutageBtn');
    const resultBox = document.getElementById('outagePublishResult');
    const title = document.getElementById('newOutageTitle').value;
    const provider = document.getElementById('newOutageProvider').value;
    const areas = document.getElementById('newOutageAreas').value.split(',').map(s => s.trim());
    const desc = document.getElementById('newOutageDesc').value;

    btn.disabled = true;
    resultBox.style.display = 'block';

    try {
      const created = await createOutage(getCurrentToken(), {
        title,
        provider,
        affected_areas: areas,
        description: desc,
      });

      resultBox.className = 'result-box box-success';
      resultBox.innerHTML = `
        <strong>✅ Avarie publicată cu succes în baza de date!</strong>
        <p style="margin: 4px 0 0;">ID: <code>${created.id}</code> (Autorizat prin FIDO2 Passkey)</p>
      `;
    } catch (err) {
      resultBox.className = 'result-box box-danger';
      if (err.status === 403 && err.message.includes('MFA')) {
        resultBox.innerHTML = `
          <strong>🛡️ RFC 9470 Step-Up MFA Challenge Necesitat!</strong>
          <p style="margin: 4px 0 0;">${err.message}</p>
          <button class="btn btn-sm btn-primary" id="stepUpNowBtn" style="margin-top: 8px;">
            Aprobă Step-Up cu Passkey (Upgrade dev_admin_mfa)
          </button>
        `;
        document.getElementById('stepUpNowBtn')?.addEventListener('click', async () => {
          await switchToken('dev_admin_mfa');
        });
      } else {
        resultBox.innerHTML = `<strong>❌ Eroare:</strong> ${err.message}`;
      }
    } finally {
      btn.disabled = false;
    }
  });
}

function updateAdminInspector(plot) {
  const titleEl = document.getElementById('adminInspectorTitle');
  const idEl = document.getElementById('adminPlotId');
  const typeEl = document.getElementById('adminPlotType');
  const statusEl = document.getElementById('adminPlotStatus');
  const toggleBtn = document.getElementById('adminToggleOccupancyBtn');
  const delBtn = document.getElementById('adminDeletePlotBtn');

  if (!plot) {
    if (titleEl) titleEl.textContent = 'Niciun Plot Selectat';
    if (idEl) { idEl.value = ''; idEl.disabled = true; }
    if (typeEl) typeEl.disabled = true;
    if (statusEl) statusEl.disabled = true;
    if (toggleBtn) toggleBtn.disabled = true;
    if (delBtn) delBtn.disabled = true;
    return;
  }

  if (titleEl) titleEl.textContent = `Editare: ${plot.id}`;
  if (idEl) { idEl.value = plot.id; idEl.disabled = false; }
  if (typeEl) { typeEl.value = plot.type || 'standard'; typeEl.disabled = false; }
  if (statusEl) { statusEl.value = plot.status || 'available'; statusEl.disabled = false; }
  if (toggleBtn) toggleBtn.disabled = false;
  if (delBtn) delBtn.disabled = false;
}
