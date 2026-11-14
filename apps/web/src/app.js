import { getCurrentUser, initAuth, isAdmin, isLoggedIn, loginGoogleUser, logout, onAuthChange, switchToken } from './auth.js';
import { renderNavbar, renderMenu } from './components/Navbar.js';
import { renderAuthModal } from './components/AuthModal.js';
import { applyTheme, toggleTheme } from './ui.js';
import { fetchLots, saveLotPlots } from './api.js';
import * as home from './views/HomeView.js';
import * as map from './views/MapView.js';
import * as alerts from './views/AlertsView.js';
import * as community from './views/CommunityView.js';
import * as parkie from './views/ParkieView.js';
import * as assistant from './views/AssistantView.js';
import * as admin from './views/AdminView.js';

const VIEWS = { home, map, alerts, community, parkie, assistant, admin };
let activeTab = 'home';
let cleanup = () => {};
let navToken = 0;

const ctx = () => ({ user: getCurrentUser(), loggedIn: isLoggedIn(), staff: isAdmin() });

export async function initApp() {
  applyTheme();
  await initAuth();
  window.addEventListener('hop-theme', renderHeader);
  window.addEventListener('hashchange', () => show(tabFromHash(), false));
  onAuthChange(() => {
    renderHeader();
    // a signed-out or non-staff visitor cannot stay on the dashboard
    show(activeTab === 'admin' && !isAdmin() ? 'home' : activeTab, false);
  });
  await show(tabFromHash(), false);
}

const tabFromHash = () => {
  const t = location.hash.replace(/^#\/?/, '');
  return VIEWS[t] ? t : 'home';
};

function renderHeader() {
  const el = document.getElementById('navbarContainer');
  if (!el) return;
  el.innerHTML = renderNavbar(activeTab);
  el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab)));
  document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('loginBtn')?.addEventListener('click', openAuthModal);
  document.getElementById('userBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });
}

function toggleMenu() {
  const host = document.getElementById('menuHost');
  if (host.innerHTML) { host.innerHTML = ''; return; }
  host.innerHTML = renderMenu();
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

async function show(tab, scrollTop = true) {
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
  main.innerHTML = '<div class="page"><p class="muted" style="padding:48px 0;text-align:center">Loading…</p></div>';
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
    cleanup = view.mount ? view.mount(c, {}) || (() => {}) : () => {};
  }
  if (scrollTop) window.scrollTo(0, 0);
}

function openAuthModal(error = '') {
  const host = document.getElementById('modalContainer');
  const close = () => { host.innerHTML = ''; };
  host.innerHTML = renderAuthModal({ error: typeof error === 'string' ? error : '' });
  document.getElementById('closeAuthBtn')?.addEventListener('click', close);
  document.getElementById('authBackdrop')?.addEventListener('click', (e) => { if (e.target.id === 'authBackdrop') close(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });

  const signIn = async (fn) => {
    try {
      const user = await fn();
      close();
      showToast(`Welcome, ${user.name.split(' ')[0]}.`);
      // staff go straight to their dashboard, everyone else stays where they were
      if (user.role === 'admin' && activeTab === 'home') go('admin');
    } catch (e) {
      openAuthModal(e.message);
    }
  };
  document.getElementById('googleLoginBtn')?.addEventListener('click', () => signIn(() => loginGoogleUser({ email: 'alex.popescu@gmail.com', name: 'Alex Popescu' })));
  document.getElementById('emailForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value.trim();
    signIn(() => loginGoogleUser({ email, name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));
  });
  document.getElementById('demoResidentBtn')?.addEventListener('click', () => signIn(() => switchToken('dev_resident')));
  document.getElementById('demoAdminBtn')?.addEventListener('click', () => signIn(() => switchToken('dev_admin_mfa')));
  document.getElementById('emailInput')?.focus();
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
