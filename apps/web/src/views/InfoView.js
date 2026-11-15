import { hubGet } from '../api.js';
import { getLang } from '../i18n.js';
import { art, esc } from '../ui.js';

/** Visitor info: practical things to know when you arrive in the city, by category. Open to everyone. */
export async function render() {
  return `<div class="page">
    <h1 class="page-title">Visitor info</h1>
    <p class="page-sub">Good to know when you arrive in the city.</p>
    <div class="pills" id="infoCats" style="margin-top:20px" role="group" aria-label="Categories"></div>
    <div class="list section" id="infoList"><div class="empty">Loading…</div></div>
  </div>`;
}

export function mount() {
  const lang = getLang();
  let category = null;
  let cats = [];
  const drawCats = () => {
    const box = document.getElementById('infoCats');
    box.innerHTML = [`<button class="pill ${category ? '' : 'on'}" data-c="">All</button>`, ...cats.map((c) => `<button class="pill ${category === c.id ? 'on' : ''}" data-c="${esc(c.id)}">${esc(c.label[lang] || c.label.en)}</button>`)].join('');
    box.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { category = b.dataset.c || null; drawCats(); load(); }));
  };
  const load = async () => {
    const list = document.getElementById('infoList');
    try {
      const r = await hubGet(`/v1/m/visitor-info?lang=${lang}${category ? `&category=${encodeURIComponent(category)}` : ''}`);
      const entries = r.entries || r;
      list.innerHTML = entries.map((e) => `
        <details class="row info-entry" style="display:block">
          <summary style="display:flex;gap:14px;align-items:center;cursor:pointer;list-style:none">
            <div class="art">${art('visitorInfo', 44)}</div>
            <div class="body"><div class="title">${esc(e.title)}</div>${e.verify ? '<div class="detail">Check before you travel</div>' : ''}</div>
          </summary>
          <p style="margin:10px 0 4px 58px;white-space:pre-line">${esc(e.text)}</p>
          ${(e.sources || []).length ? `<p class="muted" style="margin:0 0 6px 58px;font-size:13px">Source: ${e.sources.map((s) => (/^https?:/.test(s) ? `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s.replace(/^https?:\/\//, '').split('/')[0])}</a>` : esc(s))).join(', ')}</p>` : ''}
        </details>`).join('') || '<div class="empty">No information in this category.</div>';
    } catch {
      list.innerHTML = '<div class="empty">Could not load the information.</div>';
    }
  };
  hubGet('/v1/m/visitor-info/categories').then((r) => { cats = r.categories || []; drawCats(); }).catch(() => {});
  drawCats();
  load();
}
