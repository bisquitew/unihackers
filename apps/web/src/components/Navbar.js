import { getCurrentUser, isAdmin } from '../auth.js';

export function renderNavbar(activeTab, onTabSelect, onAuthClick) {
  const user = getCurrentUser();
  const userIsAdmin = isAdmin();

  const navItems = [
    { id: 'home', label: '🏠 Acasă' },
    { id: 'map', label: '🗺️ Hartă' },
    { id: 'alerts', label: '📢 Alerte Oraș' },
    { id: 'community', label: '🎭 Comunitate' },
    { id: 'parkie', label: '🅿️ Parcări' },
    { id: 'assistant', label: '🤖 Asistent AI' },
  ];

  // Admin tab is always visible, but indicates badge/lock
  navItems.push({
    id: 'admin',
    label: userIsAdmin ? '🛡️ Panou Admin' : '🔒 Admin',
    isAdminOnly: true
  });

  return `
    <header class="app-header">
      <div class="brand-section">
        <span class="brand-badge">TIMIȘOARA</span>
        <div>
          <div class="brand-title">City Hub Platform</div>
          <div class="brand-subtitle">Platformă Civică & Comunitară Unificată</div>
        </div>
      </div>

      <nav class="nav-links">
        ${navItems.map(item => `
          <button class="nav-link ${activeTab === item.id ? 'active' : ''} ${item.isAdminOnly && userIsAdmin ? 'admin-nav-item' : ''}" data-tab="${item.id}">
            ${item.label}
          </button>
        `).join('')}
      </nav>

      <div class="header-status">
        <button class="user-chip ${userIsAdmin ? 'admin-chip' : ''}" id="userChipBtn">
          <span class="user-dot"></span>
          <span class="user-name">${user?.name || 'Andrei Timișan'}</span>
          <span class="user-role-badge">${(user?.role || 'resident').toUpperCase()}</span>
        </button>
      </div>
    </header>
  `;
}
