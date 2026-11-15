import { getCurrentUser, initAuth, isAdmin, isLoggedIn, loginGoogleUser, loginEmailUser, loginWithAuth0, logout, onAuthChange, switchToken, registerAccount } from './auth.js';
import { renderNavbar, renderMenu } from './components/Navbar.js';
import { renderAuthModal } from './components/AuthModal.js';
import { applyTheme, syncTabState, toggleTheme, trapDialog } from './ui.js';
import { setLang, startI18n } from './i18n.js';
import { fetchLots, saveLotPlots } from './api.js';
import * as home from './views/HomeView.js';
import * as map from './views/MapView.js';
import * as alerts from './views/AlertsView.js';
import * as community from './views/CommunityView.js';
import * as parkie from './views/ParkieView.js';
import * as assistant from './views/AssistantView.js';
import * as admin from './views/AdminView.js';
import * as profile from './views/ProfileView.js';
import * as report from './views/ReportView.js';
import * as info from './views/InfoView.js';
import * as feedback from './views/FeedbackView.js';

const VIEWS = { home, map, alerts, community, parkie, assistant, admin, profile, report, info, feedback };
let activeTab = 'home';
let cleanup = () => {};
let navToken = 0;

const ctx = () => ({ user: getCurrentUser(), loggedIn: isLoggedIn(), staff: isAdmin() });

export async function initApp() {
  applyTheme();
  await initAuth();
  window.addEventListener('hop-theme', renderHeader);
  // the Profile settings changed the saved theme: apply it, then tell the map and header
  window.addEventListener('hop-set-theme', () => { applyTheme(); window.dispatchEvent(new Event('hop-theme')); });
  window.addEventListener('hop-lang', renderHeader);
  window.addEventListener('hop-refresh', () => show(activeTab, false, true));
  window.addEventListener('hashchange', () => show(tabFromHash(), false));
  onAuthChange(() => {
    renderHeader();
    // a signed-out or non-staff visitor cannot stay on the dashboard
    show(activeTab === 'admin' && !isAdmin() ? 'home' : activeTab, false);
  });
  await show(tabFromHash(), false);
  startI18n();
  syncTabState();
}

const tabFromHash = () => {
  // "#/map/evt-001" or "#/map?alert=..." is the map; only the first part names the page
  const t = location.hash.replace(/^#\/?/, '').split('?')[0].split('/')[0];
  return VIEWS[t] ? t : 'home';
};

function renderHeader() {
  const el = document.getElementById('navbarContainer');
  if (!el) return;
  el.innerHTML = renderNavbar(activeTab);
  el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab)));
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  el.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.lang); renderHeader(); }));
  document.getElementById('loginBtn')?.addEventListener('click', openAuthModal);
  document.getElementById('userBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });
}

function toggleMenu() {
  const host = document.getElementById('menuHost');
  const btn = document.getElementById('userBtn');
  if (host.innerHTML) { host.innerHTML = ''; btn?.setAttribute('aria-expanded', 'false'); return; }
  host.innerHTML = renderMenu();
  btn?.setAttribute('aria-expanded', 'true');
  host.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { host.innerHTML = ''; go(b.dataset.tab); }));
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    host.innerHTML = '';
    await logout();
    showToast('You are logged out.');
  });
}
document.addEventListener('click', () => { const h = document.getElementById('menuHost'); if (h) h.innerHTML = ''; });

export function go(tab) {
  if (location.hash !== `#/${tab}`) location.hash = `#/${tab}`;
  else show(tab, true);
}

async function show(tab, scrollTop = true, soft = false) {
  if (tab === 'admin' && !isAdmin()) {
    if (isLoggedIn()) showToast('The dashboard is for city staff.');
    else openAuthModal();
    tab = 'home';
  }
  const mine = ++navToken;
  activeTab = tab;
  renderHeader();
  cleanup();
  cleanup = () => {};
  const main = document.getElementById('mainContent');
  // a soft refresh (after posting, upvoting...) keeps the page in place instead of flashing "Loading"
  if (!soft) main.innerHTML = '<div class="page"><p class="muted" style="padding:48px 0;text-align:center">Loading…</p></div>';
  const keepScroll = window.scrollY;
  const view = VIEWS[tab];
  const c = ctx();
  let html;
  try {
    html = await view.render(c);
  } catch (e) {
    console.error(e);
    html = `<div class="page"><div class="empty">Could not load this page. Is the API running?</div></div>`;
  }
  if (mine !== navToken) return; // the person moved on while this was loading
  main.innerHTML = html;
  main.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => go(b.dataset.goto)));
  main.querySelectorAll('[data-login]').forEach((b) => b.addEventListener('click', openAuthModal));
  if (tab === 'admin') {
    cleanup = (await view.mount(c, { fetchLots, saveLotPlots, showToast })) || (() => {});
  } else {
    cleanup = view.mount ? view.mount(c, { showToast }) || (() => {}) : () => {};
  }
  if (scrollTop) window.scrollTo(0, 0);
  else if (soft) window.scrollTo(0, keepScroll);
}

function openAuthModal(error = '', mode = 'login') {
  const host = document.getElementById('modalContainer');
  let release = () => {};
  const close = () => { release(); host.innerHTML = ''; };
  host.innerHTML = renderAuthModal({ error: typeof error === 'string' ? error : '', mode });
  release = trapDialog(host.querySelector('.dialog'), close);
  document.getElementById('closeAuthBtn')?.addEventListener('click', close);
  document.getElementById('authBackdrop')?.addEventListener('click', (e) => { if (e.target.id === 'authBackdrop') close(); });

  // Tab & mode switching
  document.getElementById('tabLoginBtn')?.addEventListener('click', () => { close(); openAuthModal('', 'login'); });
  document.getElementById('tabRegisterBtn')?.addEventListener('click', () => { close(); openAuthModal('', 'register'); });
  document.getElementById('switchToRegisterBtn')?.addEventListener('click', () => { close(); openAuthModal('', 'register'); });
  document.getElementById('switchToLoginBtn')?.addEventListener('click', () => { close(); openAuthModal('', 'login'); });

  const signIn = async (fn) => {
    try {
      const user = await fn();
      close();
      showToast(`Logged in as ${user.name.split(' ')[0]}.`);
      // staff go straight to their dashboard, everyone else stays where they were
      if (user.role === 'admin' && activeTab === 'home') go('admin');
    } catch (e) {
      openAuthModal(e.message, mode);
    }
  };

  const emailInput = document.getElementById('emailInput');
  const preview = document.getElementById('accountTypePreview');
  const passwordContainer = document.getElementById('passwordFieldContainer');
  const passwordInput = document.getElementById('passwordInput');

  // Real-time live account type detection to prevent role ambiguity / confused-deputy issues
  const updateAccountTypePreview = (val) => {
    const email = (val || '').trim().toLowerCase();
    const isStaff = email.includes('@') && (email.includes('admin') || email.includes('primaria') || (email.endsWith('@timisoara-hub.ro') && !email.includes('resident') && !email.includes('student')));
    if (preview) preview.textContent = isStaff ? 'City staff account. Enter your staff password.' : '';
    if (passwordContainer) {
      passwordContainer.style.display = isStaff ? 'block' : 'none';
    }
  };

  emailInput?.addEventListener('input', (e) => updateAccountTypePreview(e.target.value));

  document.getElementById('auth0LoginBtn')?.addEventListener('click', () => {
    signIn(() => loginWithAuth0());
  });

  document.getElementById('emailForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput?.value.trim() || '';
    const password = passwordInput?.value.trim() || undefined;
    signIn(() => loginEmailUser({ email, password }));
  });

  document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regNameInput')?.value.trim() || '';
    const email = document.getElementById('regEmailInput')?.value.trim() || '';
    const neighbourhood = document.getElementById('regNeighbourhoodSelect')?.value || 'Cetate';
    const password = document.getElementById('regPasswordInput')?.value.trim() || undefined;
    signIn(() => registerAccount({ name, email, password, neighbourhood }));
  });

  document.getElementById('demoResidentBtn')?.addEventListener('click', () => {
    signIn(() => switchToken('dev_resident'));
  });

  document.getElementById('demoAdminBtn')?.addEventListener('click', () => {
    signIn(() => switchToken('dev_admin_mfa'));
  });

  if (mode === 'register') {
    document.getElementById('regNameInput')?.focus();
  } else {
    emailInput?.focus();
  }
}

export function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => el.classList.remove('show'), 3500);
}

window.addEventListener('DOMContentLoaded', initApp);
