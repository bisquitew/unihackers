import { fetchOutages, checkAddressOutages, fetchTransitLines, checkTransitStop, fetchAreaAlerts, checkAreaProximity } from '../api.js';

export async function renderAlertsView() {
  const [outages, transit, areaAlerts] = await Promise.all([
    fetchOutages(),
    fetchTransitLines(),
    fetchAreaAlerts(),
  ]);

  return `
    <div class="view-content alerts-view">
      
      <!-- Checkers Hero (3 columns) -->
      <section class="checkers-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        
        <!-- Danger & Construction Perimeter Checker -->
        <div class="checker-card" style="border-color: rgba(239, 68, 68, 0.4); background: linear-gradient(180deg, rgba(239, 68, 68, 0.05), rgba(24, 24, 27, 0.8));">
          <div class="checker-header">
            <span class="checker-icon">🚨</span>
            <div>
              <div class="checker-title">Verificator Perimetru Pericol / Șantier</div>
              <div class="checker-sub">Află dacă adresa ta este în raza unui focar sau șantier</div>
            </div>
          </div>
          <div class="search-input-group">
            <input type="text" id="dangerInput" class="form-control" placeholder="ex: Circumvalațiunii, Pasajul Jiul, Mehala...">
            <button class="btn btn-primary" id="checkDangerBtn" style="background-color: #ef4444; border-color: #ef4444; color: white;">Verifică Rază</button>
          </div>
          <div id="dangerResultBox" class="result-box" style="display: none;"></div>
        </div>

        <!-- Address Checker -->
        <div class="checker-card">
          <div class="checker-header">
            <span class="checker-icon">🚰</span>
            <div>
              <div class="checker-title">Verificator Avarii Utilități</div>
              <div class="checker-sub">Verifică avariile Colterm & Aquatim la adresa ta</div>
            </div>
          </div>
          <div class="search-input-group">
            <input type="text" id="addressInput" class="form-control" placeholder="ex: Calea Șagului, Timișoara">
            <button class="btn btn-primary" id="checkAddressBtn">Verifică</button>
          </div>
          <div id="addressResultBox" class="result-box" style="display: none;"></div>
        </div>

        <!-- Transit Stop Checker -->
        <div class="checker-card">
          <div class="checker-header">
            <span class="checker-icon">🚊</span>
            <div>
              <div class="checker-title">Verificator Linii & Stații STPT</div>
              <div class="checker-sub">Verifică dacă stația ta este afectată de devieri</div>
            </div>
          </div>
          <div class="search-input-group">
            <input type="text" id="stationInput" class="form-control" placeholder="ex: Calea Bogdăneștilor">
            <button class="btn btn-primary" id="checkStationBtn">Verifică</button>
          </div>
          <div id="stationResultBox" class="result-box" style="display: none;"></div>
        </div>

      </section>

      <!-- Active Danger & Construction Area Alerts (NEW) -->
      <section class="section-container" style="margin-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <h3 class="section-heading" style="margin: 0; display: flex; align-items: center; gap: 8px;">
              🚨 Perimetre de Pericol & Șantiere în Lucru (${areaAlerts.length})
            </h3>
            <p style="margin: 4px 0 0; font-size: 12px; color: #a1a1aa;">
              Evenimente cu rază geografică de impact mapată și semnalare automată a vecinilor din jur.
            </p>
          </div>
          <span style="font-size: 11px; padding: 4px 10px; border-radius: 20px; background: rgba(239, 68, 68, 0.15); color: #fca5a5; font-weight: 700; border: 1px solid rgba(239, 68, 68, 0.3);">
            LIVE RADIUS SIGNALING
          </span>
        </div>

        <div class="cards-grid">
          ${areaAlerts.map(alert => {
    const isDanger = alert.type === 'danger';
    const badgeColor = isDanger ? 'status-red' : 'status-yellow';
    const borderCol = isDanger ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)';

    return `
              <div class="detail-card" style="border-color: ${borderCol};">
                <div class="detail-card-top">
                  <span class="provider-tag" style="background: ${isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${isDanger ? '#f87171' : '#fbbf24'}; font-weight: 800;">
                    ${isDanger ? '🚨 PERICOL IMINENT' : '🚧 ȘANTIER / CONSTRUCȚIE'}
                  </span>
                  <span class="status-badge ${badgeColor}">RAZĂ: ${alert.radius_meters}m</span>
                </div>
                <div class="detail-card-title" style="margin-top: 6px; font-size: 15px;">${alert.title}</div>
                <div class="detail-card-body" style="font-size: 12px; color: #d1d5db; line-height: 1.45;">${alert.description}</div>
                
                <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 10px; margin: 10px 0; font-size: 11px; display: flex; flex-direction: column; gap: 4px;">
                  <div>📍 <strong>Focar principal:</strong> ${alert.neighbourhood || 'Timișoara'}</div>
                  <div>📡 <strong>Vecini & Cartiere semnalate:</strong> <span style="color: #38bdf8; font-weight: 600;">${(alert.affected_neighbourhoods || []).join(', ')}</span></div>
                  <div>👥 <strong>Rezidenți notificați în perimetru:</strong> <strong style="color: #4ade80;">${alert.affected_residents_count || 0} cetățeni</strong></div>
                </div>

                <div class="detail-card-footer" style="padding-top: 8px; border-top: 1px solid #27272a;">
                  <span>Severitate: <strong style="color: ${isDanger ? '#ef4444' : '#f59e0b'};">${alert.severity.toUpperCase()}</strong></span>
                  <span>Status: <strong>${alert.status.toUpperCase()}</strong></span>
                </div>

                <button class="btn btn-primary btn-sm view-alert-map-btn" data-alert-id="${alert.id}" style="margin-top: 10px; width: 100%; background: ${isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; border: 1px solid ${isDanger ? '#ef4444' : '#f59e0b'}; color: ${isDanger ? '#fca5a5' : '#fcd34d'}; font-weight: 700; cursor: pointer; padding: 7px 12px; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  🗺️ Vezi perimetrul de ${alert.radius_meters}m pe hartă
                </button>
              </div>
            `;
  }).join('')}
        </div>
      </section>

      <!-- Active Outages Table / Cards -->
      <section class="section-container" style="margin-top: 24px;">
        <h3 class="section-heading">🔥 Avarii Rețea Termică & Apă Potabilă (${outages.length})</h3>
        <div class="cards-grid">
          ${outages.map(out => `
            <div class="detail-card">
              <div class="detail-card-top">
                <span class="provider-tag tag-${out.provider.toLowerCase()}">${out.provider}</span>
                <span class="status-badge ${out.status === 'investigating' ? 'status-yellow' : 'status-red'}">${out.status.toUpperCase()}</span>
              </div>
              <div class="detail-card-title">${out.title}</div>
              <div class="detail-card-body">${out.description}</div>
              <div class="detail-card-footer">
                <span>Cartiere: <strong>${(out.affected_areas || []).join(', ')}</strong></span>
                <span>Estimare: <strong>${out.estimated_restore ? new Date(out.estimated_restore).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'În evaluare'}</strong></span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Transit Lines & Detours -->
      <section class="section-container">
        <h3 class="section-heading">🚊 Linii Transport Public STPT (${transit.length})</h3>
        <div class="cards-grid">
          ${transit.map(line => `
            <div class="detail-card">
              <div class="detail-card-top">
                <span class="line-badge">${line.line_number}</span>
                <span class="status-badge ${line.status === 'normal' ? 'status-green' : (line.status === 'suspended' ? 'status-red' : 'status-yellow')}">
                  ${line.status.toUpperCase()}
                </span>
              </div>
              <div class="detail-card-title">${line.name}</div>
              <div class="detail-card-body">${line.route_description || 'Traseu standard STPT Timișoara'}</div>
              ${line.active_detour ? `
                <div class="detour-alert-box">
                  <strong>⚠️ Deviere:</strong> ${line.active_detour.title} — ${line.active_detour.description}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </section>

    </div>
  `;
}

export function initAlertsLogic() {
  const dangerBtn = document.getElementById('checkDangerBtn');
  const dangerInp = document.getElementById('dangerInput');
  const dangerBox = document.getElementById('dangerResultBox');

  dangerBtn?.addEventListener('click', async () => {
    const val = dangerInp?.value?.trim();
    if (!val) return;
    dangerBtn.disabled = true;
    dangerBtn.textContent = 'Calculare...';
    const res = await checkAreaProximity({ address: val });
    dangerBox.style.display = 'block';

    const isInside = res.in_danger_zone || res.in_construction_zone;
    dangerBox.className = `result-box ${isInside ? 'box-danger' : 'box-success'}`;

    if (isInside) {
      const activeMatch = res.matching_alerts.find(m => m.is_inside_radius) || res.matching_alerts[0];
      dangerBox.innerHTML = `
        <strong>⚠️ ATENȚIE: SUNTEȚI ÎN PERIMETRU DE ${activeMatch.alert.type === 'danger' ? 'PERICOL' : 'ȘANTIER'}!</strong>
        <p style="margin: 4px 0 0; font-size: 12px;">${activeMatch.status_message}</p>
        <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.9;">Eveniment: <strong>${activeMatch.alert.title}</strong> (Rază: ${activeMatch.alert.radius_meters}m). Vecini semnalați: ${activeMatch.alert.affected_neighbourhoods.join(', ')}.</p>
      `;
    } else {
      const nearest = res.matching_alerts[0];
      dangerBox.innerHTML = `
        <strong>✅ Sunteți în siguranță! Adresa este în afara oricărui perimetru critic.</strong>
        ${nearest ? `<p style="margin: 4px 0 0; font-size: 12px;">Cel mai apropiat eveniment este <em>${nearest.alert.title}</em> la <strong>${nearest.distance_meters}m</strong> distanță (raza sa este de ${nearest.alert.radius_meters}m).</p>` : ''}
      `;
    }
    dangerBtn.disabled = false;
    dangerBtn.textContent = 'Verifică Rază';
  });

  const addressBtn = document.getElementById('checkAddressBtn');
  const addressInp = document.getElementById('addressInput');
  const addressBox = document.getElementById('addressResultBox');

  addressBtn?.addEventListener('click', async () => {
    const val = addressInp.value.trim();
    if (!val) return;
    addressBtn.disabled = true;
    addressBtn.textContent = 'Verificare...';
    const res = await checkAddressOutages(val);
    addressBox.style.display = 'block';
    addressBox.className = `result-box ${res.affected ? 'box-danger' : 'box-success'}`;
    addressBox.innerHTML = `
      <strong>${res.affected ? '⚠️ Afectat de avarie!' : '✅ Nicio avarie activă!'}</strong>
      <p style="margin: 4px 0 0;">${res.message}</p>
    `;
    addressBtn.disabled = false;
    addressBtn.textContent = 'Verifică';
  });

  const stationBtn = document.getElementById('checkStationBtn');
  const stationInp = document.getElementById('stationInput');
  const stationBox = document.getElementById('stationResultBox');

  stationBtn?.addEventListener('click', async () => {
    const val = stationInp.value.trim();
    if (!val) return;
    stationBtn.disabled = true;
    stationBtn.textContent = 'Verificare...';
    const res = await checkTransitStop(val);
    stationBox.style.display = 'block';
    stationBox.className = `result-box ${res.detour ? 'box-danger' : 'box-success'}`;
    stationBox.innerHTML = `
      <strong>${res.detour ? '⚠️ Stație deviată sau suspendată!' : '✅ Circulație normală!'}</strong>
      <p style="margin: 4px 0 0;">${res.message}</p>
    `;
    stationBtn.disabled = false;
    stationBtn.textContent = 'Verifică';
  });

  document.querySelectorAll('.view-alert-map-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-alert-id');
      if (id) {
        location.hash = `#/map?alert=${encodeURIComponent(id)}`;
      }
    });
  });
}

export { renderAlertsView as render, initAlertsLogic as mount };

