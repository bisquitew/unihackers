import { fetchLots } from '../api.js';
import { isAdmin } from '../auth.js';

export async function renderParkieView() {
  const lots = await fetchLots();
  const userIsAdmin = isAdmin();

  const totalCapacity = lots.reduce((acc, l) => acc + l.capacity, 0);
  const totalAvailable = lots.reduce((acc, l) => acc + l.available_spots, 0);

  return `
    <div class="view-content parkie-view">
      
      <!-- Parkie Header Card -->
      <section class="parkie-hero-box">
        <div class="parkie-hero-left">
          <span class="brand-badge" style="width: fit-content;">PARKIE LIVE</span>
          <h2>Sistem Inteligent de Monitorizare Video a Parcărilor</h2>
          <p>
            Parcările publice din Timișoara sunt procesate prin algoritmi de computer vision direct pe fluxurile camerelor de supraveghere. Locurile libere sunt actualizate automat pe harta orașului și în fluxul SSE în timp real.
          </p>
        </div>
        <div class="parkie-stats-grid">
          <div class="parkie-stat">
            <span class="stat-number" style="color: #38bdf8;">${totalAvailable}</span>
            <span class="stat-label">Locuri Libere</span>
          </div>
          <div class="parkie-stat">
            <span class="stat-number" style="color: #a1a1aa;">${totalCapacity}</span>
            <span class="stat-label">Capacitate Totală</span>
          </div>
          <div class="parkie-stat">
            <span class="stat-number" style="color: #22c55e;">${lots.length}</span>
            <span class="stat-label">Parcări Monitorizate</span>
          </div>
        </div>
      </section>

      ${userIsAdmin ? `
        <div class="admin-callout-banner">
          <div>
            <strong>🛡️ Mod Administrator Activ:</strong> Aveți permisiunea de a calibra camerele video și a trasa ploturile fiecărui loc de parcare.
          </div>
          <button class="btn btn-primary" id="openAdminCalibrationBtn">
            🎥 Deschide Calibrare Camere & Plots
          </button>
        </div>
      ` : `
        <div class="info-callout-banner">
          <div>
            ℹ️ <strong>Vedere Cetățean:</strong> Vizualizați disponibilitatea în timp real. Calibrarea camerelor și adăugarea de noi ploturi necesită autentificarea cu rol de <strong>Administrator</strong>.
          </div>
        </div>
      `}

      <!-- Lots Grid -->
      <div class="cards-grid" style="margin-top: 20px;">
        ${lots.map(lot => {
          const isGreen = lot.status_color === 'green';
          const isYellow = lot.status_color === 'yellow';
          const colorClass = isGreen ? 'status-green' : (isYellow ? 'status-yellow' : 'status-red');

          return `
            <div class="detail-card">
              <div class="detail-card-top">
                <span class="notice-provider">${lot.id}</span>
                <span class="status-badge ${colorClass}">${(lot.status_color || 'green').toUpperCase()}</span>
              </div>
              <div class="detail-card-title">${lot.name}</div>
              <div class="lot-progress-bar">
                <div class="lot-progress-fill ${lot.status_color}" style="width: ${Math.round((lot.available_spots / lot.capacity) * 100)}%;"></div>
              </div>
              <div class="detail-card-footer">
                <span>Libere: <strong>${lot.available_spots}</strong> / ${lot.capacity}</span>
                <span>Coordonate: <strong>${lot.latitude.toFixed(3)}, ${lot.longitude.toFixed(3)}</strong></span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}
