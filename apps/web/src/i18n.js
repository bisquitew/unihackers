// The website's language: English (as written in the code) or Romanian. Romanian comes from a dictionary keyed by the English text
// (ro.js, generated from the app's, plus ro-web.js for website-only text). Instead of changing every view, the page is translated
// after it is drawn: text, placeholders and labels are swapped, and what was there before is remembered so English can come back.
import { RO } from './ro.js';
import { RO_WEB } from './ro-web.js';

const KEY = 'hop_lang';
const all = { ...RO, ...RO_WEB };
const exact = new Map(Object.entries(all).filter(([k]) => !k.includes('{}')));
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.entries(all)
  .filter(([k]) => k.includes('{}'))
  .map(([from, to]) => ({ re: new RegExp(`^${from.split('{}').map(escapeRegExp).join('(.+?)')}$`), to }));

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'ro' || saved === 'en') return saved;
  } catch {}
  return (navigator.language || '').toLowerCase().startsWith('ro') ? 'ro' : 'en';
}
let lang = initial();
export const getLang = () => lang;
/** The locale for dates and times: Romanian or British English (24-hour clock in both). */
export const dateLocale = () => (lang === 'ro' ? 'ro-RO' : 'en-GB');

/** The text in the current language; unknown text comes back unchanged. */
export function tr(text) {
  if (lang === 'en' || !text) return text;
  const hit = exact.get(text);
  if (hit !== undefined) return hit;
  const trimmed = text.trim();
  if (trimmed && trimmed !== text) {
    const inner = exact.get(trimmed);
    if (inner !== undefined) return text.replace(trimmed, inner);
  }
  for (const { re, to } of templates) {
    const m = re.exec(trimmed || text);
    if (m) {
      let i = 1;
      return to.replace(/\{\}/g, () => m[i++] ?? '');
    }
  }
  return text;
}

const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'TEXTAREA', 'CODE', 'SVG', 'CANVAS']);
const seenText = new WeakMap(); // text node -> { en, shown }
const seenAttr = new WeakMap(); // element -> { attr: { en, shown } }
let busy = false;

function swapText(n) {
  const v = n.nodeValue;
  const rec = seenText.get(n);
  // text the page wrote after our last swap is the new English original
  const en = rec && rec.shown === v ? rec.en : v;
  const out = lang === 'en' ? en : tr(en);
  if (out !== v) n.nodeValue = out;
  seenText.set(n, { en, shown: out });
}
function swapAttrs(el) {
  let rec = seenAttr.get(el);
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const v = el.getAttribute(a);
    const r = rec?.[a];
    const en = r && r.shown === v ? r.en : v;
    const out = lang === 'en' ? en : tr(en);
    if (out !== v) el.setAttribute(a, out);
    if (!rec) { rec = {}; seenAttr.set(el, rec); }
    rec[a] = { en, shown: out };
  }
}
function walk(node) {
  if (node.nodeType === 3) {
    if (node.nodeValue.trim() || seenText.has(node)) swapText(node);
    return;
  }
  if (node.nodeType !== 1) return;
  if (node.closest('[data-notr]')) return;
  swapAttrs(node);
  // a textarea, an iframe and the like keep their content, but their placeholder and labels are still text people read
  if (SKIP.has(node.tagName.toUpperCase())) return;
  for (let c = node.firstChild; c; c = c.nextSibling) walk(c);
}

export function translatePage(root = document.body) {
  busy = true;
  try { walk(root); } finally { busy = false; }
}

export function startI18n() {
  document.documentElement.lang = lang;
  translatePage();
  new MutationObserver((muts) => {
    if (busy) return;
    busy = true;
    try {
      for (const m of muts) {
        if (m.type === 'childList') m.addedNodes.forEach((n) => walk(n));
        else if (m.type === 'characterData') swapText(m.target);
        else if (m.type === 'attributes') swapAttrs(m.target);
      }
    } finally { busy = false; }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

export function setLang(next) {
  if (next === lang) return;
  lang = next;
  try { localStorage.setItem(KEY, next); } catch {}
  document.documentElement.lang = next;
  translatePage();
  window.dispatchEvent(new Event('hop-lang'));
}
