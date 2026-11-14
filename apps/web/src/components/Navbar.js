import { getCurrentUser, isAdmin, isLoggedIn } from '../auth.js';
import { esc, icons, initials, isDark, tone } from '../ui.js';
import { CITY } from '../city.js';

const ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'map', label: 'Map' },
  { id: 'community', label: 'Community' },
  { id: 'parkie', label: 'Parking' },
  { id: 'assistant', label: 'Assistant' },
];

export function renderNavbar(activeTab) {
  const user = getCurrentUser();
  const staff = isAdmin();
  const items = staff ? [...ITEMS, { id: 'admin', label: 'Dashboard' }] : ITEMS;
  return `
    <header class="topbar">
      <button class="brand" data-tab="home" aria-label="hop, home">hop <small>${esc(CITY.name)}</small></button>
      <nav class="nav" aria-label="Main">
        ${items.map((i) => `<button data-tab="${i.id}" class="${activeTab === i.id ? 'active' : ''}" ${activeTab === i.id ? 'aria-current="page"' : ''}>${i.label}</button>`).join('')}
      </nav>
      <div class="top-actions">
        <button class="icon-btn" id="themeBtn" aria-label="Switch to ${isDark() ? 'light' : 'dark'} mode">${isDark() ? icons.sun : icons.moon}</button>
        <button class="icon-btn" data-tab="alerts" aria-label="City alerts">${icons.bell}<i class="dot"></i></button>
        ${isLoggedIn()
          ? `<button class="user-btn" id="userBtn" aria-haspopup="true" aria-label="Account menu"><span class="avatar ${tone(user.sub)}">${esc(initials(user.name))}</span>${esc(user.name.split(' ')[0])}</button>`
          : `<button class="btn btn-primary btn-md" id="loginBtn">Log in</button>`}
      </div>
    </header>`;
}

export function renderMenu() {
  const user = getCurrentUser();
  return `
    <div class="menu" role="menu" id="userMenu">
      <div class="who"><strong>${esc(user.name)}</strong><span class="muted">${esc(user.email)} · ${esc(user.role)}</span></div>
      ${isAdmin() ? `<button role="menuitem" data-tab="admin">Dashboard</button>` : `<button role="menuitem" data-tab="community">Your community</button>`}
      <button role="menuitem" id="logoutBtn">${icons.out} Log out</button>
    </div>`;
}
