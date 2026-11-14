import { fetchOutages, checkAddressOutages, fetchTransitLines, checkTransitStop } from '../api.js';

export async function renderAlertsView() {
  const [outages, transit] = await Promise.all([
    fetchOutages(),
    fetchTransitLines(),
  ]);

  return `
    <div class="view-content alerts-view">
      
      <!-- Checkers Hero -->
      <section class="checkers-grid">
        
        <!-- Address Checker -->
        <div class="checker-card">
          <div class="checker-header">
            <span class="checker-icon">🏠</span>
            <div>
              <div class="checker-title">Verificator Avarii Utilități la Adresa Ta</div>
              <div class="checker-sub">Introduceți strada sau cartierul pentru a verifica avariile Colterm & Aquatim</div>
            </div>
          </div>
          <div class="search-input-group">
            <input type="text" id="addressInput" class="form-control" placeholder="ex: Strada Circumvalațiunii 14, Timișoara">
            <button class="btn btn-primary" id="checkAddressBtn">Verifică</button>
          </div>
          <div id="addressResultBox" class="result-box" style="display: none;"></div>
        </div>

        <!-- Transit Stop Checker -->
        <div class="checker-card">
          <div class="checker-header">
            <span class="checker-icon">🚊</span>
            <div>
              <div class="checker-title">Verificator Linii & Stații STPT 2026</div>
              <div class="checker-sub">Verifică dacă stația ta este afectată de șantierele de reabilitare</div>
            </div>
          </div>
          <div class="search-input-group">
            <input type="text" id="stationInput" class="form-control" placeholder="ex: Calea Bogdăneștilor">
            <button class="btn btn-primary" id="checkStationBtn">Verifică</button>
          </div>
          <div id="stationResultBox" class="result-box" style="display: none;"></div>
        </div>

      </section>

      <!-- Active Outages Table / Cards -->
      <section class="section-container">
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
}
