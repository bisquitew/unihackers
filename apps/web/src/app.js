import { initAuth, onAuthChange, switchToken, getCurrentUser } from './auth.js';
import { renderNavbar } from './components/Navbar.js';
import { renderAuthModal } from './components/AuthModal.js';
import { renderHomeView } from './views/HomeView.js';
import { renderMapView, initMapLogic } from './views/MapView.js';
import { renderAlertsView, initAlertsLogic } from './views/AlertsView.js';
import { renderCommunityView } from './views/CommunityView.js';
import { renderParkieView } from './views/ParkieView.js';
import { renderAssistantView, initAssistantLogic } from './views/AssistantView.js';
import { renderAdminView, initAdminLogic } from './views/AdminView.js';
import { fetchLots, fetchOutages, fetchEvents, fetchSmellPins, saveLotPlots, simulateLocationAnomaly } from './api.js';

let activeTab = 'home';
let cachedLots = [];

export async function initApp() {
  console.log('[Timișoara Hub Web] Initializing unified platform...');

  // 1. Initialize Auth state
  await initAuth();

  // 2. Initial Data Load
  try {
    cachedLots = await fetchLots();
  } catch (e) {
    console.warn('Could not prefetch lots:', e);
  }

  // 3. Render Navbar
  renderHeader();

  // 4. Render Active Tab
  await switchTab(activeTab);

  // 5. Setup Listeners
  onAuthChange(() => {
    renderHeader();
    switchTab(activeTab);
  });
}

function renderHeader() {
  const headerContainer = document.getElementById('navbarContainer');
  if (!headerContainer) return;

  headerContainer.innerHTML = renderNavbar(activeTab);

  // Nav link clicks
  headerContainer.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // User chip click -> open auth modal
  document.getElementById('userChipBtn')?.addEventListener('click', () => {
    openAuthModal();
  });
}

export async function switchTab(tabId) {
  activeTab = tabId;
  renderHeader();

  const mainEl = document.getElementById('mainContent');
  if (!mainEl) return;

  mainEl.innerHTML = '<div class="view-content" style="text-align: center; padding: 48px;"><p>Se încarcă datele orașului...</p></div>';

  if (tabId === 'home') {
    mainEl.innerHTML = await renderHomeView();
    setupHomeNavigation();
  } else if (tabId === 'map') {
    mainEl.innerHTML = await renderMapView();
    const [lots, outages, events, smell] = await Promise.all([
      fetchLots(),
      fetchOutages(),
      fetchEvents(),
      fetchSmellPins(),
    ]);
    initMapLogic(lots, outages, events, smell.pins || []);
  } else if (tabId === 'alerts') {
    mainEl.innerHTML = await renderAlertsView();
    initAlertsLogic();
  } else if (tabId === 'community') {
    mainEl.innerHTML = await renderCommunityView();
  } else if (tabId === 'parkie') {
    mainEl.innerHTML = await renderParkieView();
    document.getElementById('openAdminCalibrationBtn')?.addEventListener('click', () => {
      switchTab('admin');
    });
  } else if (tabId === 'assistant') {
    mainEl.innerHTML = renderAssistantView();
    initAssistantLogic();
  } else if (tabId === 'admin') {
    mainEl.innerHTML = await renderAdminView();
    const lots = await fetchLots();
    initAdminLogic(lots, async (lotId, payload) => {
      const updated = await saveLotPlots(lotId, payload);
      showToast(`✅ Salvat în baza de date! ${payload.slots_data.length} plots configurate.`);
      return updated;
    });
  }
}

function setupHomeNavigation() {
  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => {
      const target = el.getAttribute('data-goto');
      if (target) switchTab(target);
    });
  });
}

function openAuthModal() {
  const modalContainer = document.getElementById('modalContainer');
  modalContainer.innerHTML = renderAuthModal();

  // Close modal
  document.getElementById('closeAuthModalBtn')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  document.getElementById('authModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'authModalBackdrop') modalContainer.innerHTML = '';
  });

  // Switch account
  modalContainer.querySelectorAll('.account-card').forEach(card => {
    card.addEventListener('click', async () => {
      const token = card.getAttribute('data-token');
      await switchToken(token);
      modalContainer.innerHTML = '';
      const user = getCurrentUser();
      showToast(`🔑 Autentificat ca ${user?.name} (${user?.role})`);
    });
  });

  // Anomaly alert simulation
  document.getElementById('simulateAnomalyBtn')?.addEventListener('click', async () => {
    const res = await simulateLocationAnomaly('București', 'România', '86.120.45.12');
    showToast(`🚨 Alertă securitate declanșată! Email și push trimise către ${res.target_email || 'rezident'}.`);
    modalContainer.innerHTML = '';
  });
}

export function showToast(msg) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 3500);
}

window.addEventListener('DOMContentLoaded', () => {
  initApp();
});
