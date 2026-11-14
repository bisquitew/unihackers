// Small helpers shared by every view: escaping, illustrations, icons, theme, QR code.
import { ART } from './art.js';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** One of the app's flat illustrations (events, buddy, forum, transit, parkie, utilities, safety, smell, ...). */
export function art(id, size = 52) {
  const body = ART[id] || ART.note;
  return `<svg viewBox="0 0 56 56" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const icons = {
  bell: svg('<path d="M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  caret: svg('<path d="M9 6l6 6-6 6"/>'),
  locate: svg('<path d="M12 3 L19 20 L12 16.5 L5 20 Z"/>'),
  out: svg('<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>'),
};

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'H';
const TONES = ['', 'blue', 'mint', 'ink'];
export const tone = (key = '') => TONES[[...String(key)].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

/* ---------- theme ---------- */
const THEME_KEY = 'hop_theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');
export const isDark = () => document.documentElement.dataset.theme === 'dark';
export function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  document.documentElement.dataset.theme = saved === 'dark' || (saved === 'system' && media.matches) ? 'dark' : 'light';
}
export function toggleTheme() {
  localStorage.setItem(THEME_KEY, isDark() ? 'light' : 'dark');
  applyTheme();
  window.dispatchEvent(new Event('hop-theme'));
}
media.addEventListener('change', () => { if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') { applyTheme(); window.dispatchEvent(new Event('hop-theme')); } });

/* ---------- QR code (qrcode-generator from the page's script tag) ---------- */
export function qrSvg(text) {
  if (!text || typeof window.qrcode !== 'function') return '';
  const qr = window.qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}

export const when = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

/** A hairline list row. `title`, `detail`, `side` must already be escaped. Optional: an illustration, a coloured number, a meter. */
export function row({ art: artHtml, num, numTone = '', title, detail, side, meter, attrs = '', tag = 'div' }) {
  return `<${tag} class="row" ${attrs}>
    ${artHtml ? `<div class="art">${artHtml}</div>` : ''}
    ${num !== undefined ? `<div class="num ${numTone}">${esc(num)}</div>` : ''}
    <div class="body"><div class="title">${title}</div>${detail ? `<div class="detail">${detail}</div>` : ''}
      ${meter !== undefined ? `<div class="meter"><i class="${meter.color || ''}" style="width:${Math.max(4, Math.min(100, meter.pct))}%"></i></div>` : ''}</div>
    ${side ? `<div class="side">${side}</div>` : ''}
  </${tag}>`;
}

export const cap = (s = '') => String(s).charAt(0).toUpperCase() + String(s).slice(1);
/** "unplanned_breakdown" -> "Unplanned breakdown" */
export const statusText = (s = '') => cap(String(s).replace(/_/g, ' '));
