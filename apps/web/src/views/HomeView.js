import { fetchOutages, fetchTransitLines, fetchEvents, fetchLots, fetchSmellWind, fetchDashboardOverview } from '../api.js';

export async function renderHomeView() {
  const [outages, transit, events, lots, wind] = await Promise.all([
    fetchOutages(),
    fetchTransitLines(),
    fetchEvents(),
    fetchLots(),
    fetchSmellWind(),
  ]);

  const totalParking = lots.reduce((acc, l) => acc + l.capacity, 0);
  const freeParking = lots.reduce((acc, l) => acc + l.available_spots, 0);

  return `
    <div class="view-content home-view">
      
      <!-- Welcome Hero Banner -->
      <section class="hero-banner">
        <div class="hero-text">
          <h1>Timișoara Smart City Hub</h1>
          <p>Platforma digitală unificată pentru servicii publice, alerte în timp real, parcări inteligente și viață comunitară.</p>
        </div>
        <div class="pulse-stats">
          <div class="pulse-stat">
            <span class="pulse-val" style="color: #ef4444;">${outages.length}</span>
            <span class="pulse-label">Avarii Active</span>
          </div>
          <div class="pulse-stat">
            <span class="pulse-val" style="color: #eab308;">${transit.filter(t => t.status !== 'normal').length}</span>
            <span class="pulse-label">Linii Deviate STPT</span>
          </div>
          <div class="pulse-stat">
            <span class="pulse-val" style="color: #38bdf8;">${freeParking}</span>
            <span class="pulse-label">Locuri Parcare Libere</span>
          </div>
          <div class="pulse-stat">
            <span class="pulse-val" style="color: #22c55e;">${events.length}</span>
            <span class="pulse-label">Evenimente Culturale</span>
          </div>
        </div>
      </section>

      <!-- Quick Action Cards -->
      <section class="quick-actions-grid">
        <div class="action-card" data-goto="alerts">
          <div class="action-icon">🚰</div>
          <div class="action-title">Avarii Colterm & Aquatim</div>
          <div class="action-desc">${outages.length} avarii în lucru. Verifică dacă adresa ta este afectată.</div>
        </div>

        <div class="action-card" data-goto="alerts">
          <div class="action-icon">🚊</div>
          <div class="action-title">Lucrări Transport STPT</div>
          <div class="action-desc">Linia 5 suspendată pe Bogdăneștilor, linia E2 deviată pe Take Ionescu.</div>
        </div>

        <div class="action-card" data-goto="parkie">
          <div class="action-icon">🅿️</div>
          <div class="action-title">Parkie Smart Parking</div>
          <div class="action-desc">${freeParking} locuri disponibile în cele 10 parcări monitorizate prin camere live.</div>
        </div>

        <div class="action-card" data-goto="community">
          <div class="action-icon">🎭</div>
          <div class="action-title">Cultură & Solana Tickets</div>
          <div class="action-desc">Descoperă micro-evenimentele și revendică bilete securizate pe Solana Devnet.</div>
        </div>
      </section>

      <!-- Main Live Feed Columns -->
      <div class="two-column-feed">
        
        <!-- Left: Critical Civic Notices -->
        <div class="feed-column">
          <div class="feed-header">
            <h3>🚨 Alerte Municipale Recente</h3>
            <button class="link-btn" data-goto="alerts">Vezi Toate &rarr;</button>
          </div>
          <div class="notice-list">
            ${outages.slice(0, 3).map(out => `
              <div class="notice-item">
                <div class="notice-top">
                  <span class="notice-provider ${out.provider.toLowerCase()}">${out.provider.toUpperCase()}</span>
                  <span class="notice-time">${out.status === 'investigating' ? 'În investigare' : 'Lucrări active'}</span>
                </div>
                <div class="notice-title">${out.title}</div>
                <div class="notice-meta">Cartiere: <strong>${(out.affected_areas || []).join(', ')}</strong></div>
                <div class="notice-desc">${out.description}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Environment & Community Pulse -->
        <div class="feed-column">
          <div class="feed-header">
            <h3>🌿 Calitatea Aerului & Vânt</h3>
            <button class="link-btn" data-goto="map">Hartă Senzori &rarr;</button>
          </div>
          
          <div class="env-card">
            <div class="wind-gauge">
              <div class="compass-circle">
                <div class="compass-needle" style="transform: rotate(${wind.directionDeg || 310}deg);"></div>
              </div>
              <div class="wind-info">
                <div class="wind-speed">${wind.speedKmh || 12} km/h</div>
                <div class="wind-dir">Direcție Vânt: <strong>${wind.compass || 'NW'} (${wind.directionDeg || 310}°)</strong></div>
                <div class="wind-desc">Vânt moderat dinspre nord-vest spre Calea Șagului și Elisabetin.</div>
              </div>
            </div>
          </div>

          <div class="feed-header" style="margin-top: 20px;">
            <h3>🎭 Evenimente Recomandate</h3>
            <button class="link-btn" data-goto="community">Vezi Agenda &rarr;</button>
          </div>
          <div class="notice-list">
            ${events.slice(0, 2).map(evt => `
              <div class="notice-item">
                <div class="notice-top">
                  <span class="notice-provider banat">${evt.category ? evt.category.toUpperCase() : 'CULTURĂ'}</span>
                  <span class="notice-time">${evt.date || 'Azi'}</span>
                </div>
                <div class="notice-title">${evt.title}</div>
                <div class="notice-desc">${evt.location || 'Timișoara Central'} • ${evt.rsvpCount || 0} participanți</div>
              </div>
            `).join('')}
          </div>

        </div>

      </div>

    </div>
  `;
}
