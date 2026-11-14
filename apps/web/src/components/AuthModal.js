import { getCurrentUser, getCurrentToken, switchToken } from '../auth.js';
import { simulateLocationAnomaly } from '../api.js';

export function renderAuthModal() {
  const user = getCurrentUser();
  const currentToken = getCurrentToken();

  const accounts = [
    { token: 'dev_resident', name: 'Andrei Timișan', role: 'resident', tier: 'tier_1_standard', desc: 'Cetățean Timișoara — acces standard' },
    { token: 'dev_admin', name: 'Elena Dobre (No MFA)', role: 'admin', tier: 'tier_1_standard', desc: 'Admin primărie — necesită Step-Up MFA pentru operațiuni critice' },
    { token: 'dev_admin_mfa', name: 'Elena Dobre (MFA Verified)', role: 'admin', tier: 'tier_2_mfa_verified', desc: 'Admin cu FIDO2 / WebAuthn Passkey — acces deplin garantat' },
    { token: 'dev_student', name: 'Ioana Pop', role: 'resident', tier: 'tier_1_standard', desc: 'Studentă UVT — comunitate și evenimente' },
    { token: 'dev_senior', name: 'Dumitru Radu', role: 'resident', tier: 'tier_1_standard', desc: 'Senior pensionar — alerte utilități cartier' },
    { token: 'dev_visitor', name: 'Lukas Weber', role: 'visitor', tier: 'tier_1_standard', desc: 'Turist / Vizitator Timișoara' },
    { token: 'dev_ai_agent', name: 'Netrom Gemini AI Worker', role: 'admin', tier: 'tier_2_mfa_verified', desc: 'Agent autonom M2M — ingestie date' },
  ];

  return `
    <div class="modal-backdrop" id="authModalBackdrop">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-title">🔐 Autentificare & Roluri Auth0</div>
            <div class="modal-subtitle">Comută profilul de test pentru jurizare și verificare RBAC / MFA</div>
          </div>
          <button class="close-btn" id="closeAuthModalBtn">&times;</button>
        </div>

        <div class="current-session-box">
          <div class="session-header">Sesiune Curentă: <strong>${user?.name || 'Andrei Timișan'}</strong></div>
          <div class="session-meta">
            <span>Email: <strong>${user?.email || 'resident@timisoara-hub.ro'}</strong></span>
            <span>Rol: <strong class="badge-${user?.role || 'resident'}">${(user?.role || 'resident').toUpperCase()}</strong></span>
            <span>Securitate: <strong>${user?.security_tier || 'tier_1_standard'}</strong></span>
          </div>
        </div>

        <div class="section-label">Selectează Profil Utilizator (Auth0 Tokens):</div>
        <div class="accounts-list">
          ${accounts.map(acc => `
            <div class="account-card ${currentToken === acc.token ? 'selected' : ''}" data-token="${acc.token}">
              <div class="account-card-top">
                <span class="account-name">${acc.name}</span>
                <span class="role-pill role-${acc.role}">${acc.role.toUpperCase()}</span>
              </div>
              <div class="account-desc">${acc.desc}</div>
              <div class="account-tier">Securitate: <code>${acc.tier}</code></div>
            </div>
          `).join('')}
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="simulateAnomalyBtn">
            🚨 Test Anomalie Geografică (Login București)
          </button>
        </div>
      </div>
    </div>
  `;
}
