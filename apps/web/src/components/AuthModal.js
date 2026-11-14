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
          <div class="session-header">Sesiune Curentă: <strong>${user?.name || 'Neautentificat'}</strong></div>
          <div class="session-meta">
            <span>Email: <strong>${user?.email || 'nedefinit'}</strong></span>
            <span>Rol: <strong class="badge-${user?.role || 'none'}">${(user?.role || 'oaspete').toUpperCase()}</strong></span>
            <span>Securitate: <strong>${user?.security_tier || 'standard'}</strong></span>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button class="btn btn-danger btn-sm" id="logoutBtn">🚪 Deconectare (Logout)</button>
          </div>
        </div>

        <div class="section-label">🌐 Conectare Rapidă cu Google:</div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px;">
          <button class="btn btn-primary" id="googleCitizenLoginBtn" style="justify-content: flex-start;">
            <span style="font-weight: 800; font-size: 14px;">G</span> Conectare cu Google (Cetățean - alex@gmail.com)
          </button>
          <button class="btn btn-secondary" id="googleAdminLoginBtn" style="justify-content: flex-start; border-color: #38bdf8; color: #38bdf8;">
            <span style="font-weight: 800; font-size: 14px;">G</span> Conectare cu Google Primărie (Admin - admin.elena@timisoara-hub.ro)
          </button>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <input type="email" id="googleCustomEmailInput" class="form-control" placeholder="Introduceți alt email Google (@timisoara-hub.ro pt Admin)..." />
            <button class="btn btn-secondary btn-sm" id="googleCustomLoginBtn" style="white-space: nowrap;">Login Google</button>
          </div>
        </div>

        <div class="section-label">Sau Selectează Profil de Test (Auth0 RBAC / MFA Tokens):</div>
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
