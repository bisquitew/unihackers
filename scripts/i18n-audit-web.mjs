// Runtime check of the website's Romanian: opens every page in English and in Romanian (in a headless Edge, nothing is saved)
// and lists the text that comes out the same in both, i.e. text that was not translated.
//   node scripts/i18n-audit-web.mjs            (needs the API on :8000, which also serves the website)
// Text that is data (event titles from the database, people's names, street names) shows up too: read the list, do not trust
// it blindly. Page states that need a click (the dashboard sections, the profile tabs, the login window) are visited as well.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SITE = process.env.SITE || 'http://localhost:8000';
const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9333;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'hop-i18n-'));
const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://localhost:${PORT}/json`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Edge did not start');
}

const ws = new WebSocket(await target());
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const waiting = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } });
const send = (method, params = {}) => new Promise((resolve) => { const n = ++id; waiting.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
const run = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
  return r.result?.result?.value;
};

// every visible piece of text on the page, in document order
const COLLECT = `(() => {
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (n.nodeType === 3) {
      const t = n.nodeValue.trim();
      if (t && !n.parentElement.closest('script,style,iframe,[data-notr],svg')) out.push('T|' + t);
    } else if (n.nodeType === 1 && !n.closest('[data-notr],svg')) {
      for (const a of ['placeholder', 'aria-label', 'title', 'alt']) { const v = n.getAttribute(a); if (v && v.trim()) out.push('A:' + a + '|' + v.trim()); }
    }
  }
  return out;
})()`;

const setLang = (lang) => run(`(async () => { localStorage.setItem('hop_lang', '${lang}'); const m = await import('/src/i18n.js'); m.setLang('${lang}'); return true; })()`);
const wait = async (ms = 1800) => sleep(ms);

const missing = new Map(); // text -> Set of pages
async function compare(pageName, prepare) {
  await setLang('en'); await wait(500);
  if (prepare) await prepare();
  await wait();
  const en = await run(COLLECT);
  await setLang('ro'); await wait(900);
  const ro = await run(COLLECT);
  if (en.length !== ro.length) { console.error(`note: ${pageName}: ${en.length} vs ${ro.length} items, comparing by text`); }
  const roSet = new Set(ro);
  for (let i = 0; i < en.length; i++) {
    const text = en[i];
    const body = text.replace(/^(T|A:[a-z-]+)\|/, '');
    if (!/[A-Za-zĂÂÎȘȚăâîșț]{3}/.test(body)) continue;
    const same = en.length === ro.length ? ro[i] === text : roSet.has(text);
    if (same) { if (!missing.has(body)) missing.set(body, new Set()); missing.get(body).add(pageName); }
  }
}

async function visit(hash) {
  await run(`location.hash = '${hash}'`);
  await wait(2200);
}

// ---- sign in as a resident and as staff using the demo tokens (the site reads hub_auth_token)
async function signIn(token) {
  await send('Page.navigate', { url: SITE + '/' });
  await wait(2500);
  await run(`localStorage.setItem('hub_auth_token', '${token}'); localStorage.setItem('hop_lang', 'en'); true`);
  await send('Page.navigate', { url: SITE + '/' });
  await wait(3000);
}
const clickAll = (selector, label) => async () => { await run(`(() => { const e = document.querySelector('${selector}'); if (e) e.click(); return !!e; })()`); await wait(1200); };

await send('Page.enable');
await send('Runtime.enable');

// guest
await send('Page.navigate', { url: SITE + '/' });
await wait(3000);
await run(`localStorage.removeItem('hub_auth_token'); true`);
await send('Page.navigate', { url: SITE + '/' });
await wait(3000);
for (const h of ['#/home', '#/map', '#/alerts', '#/community', '#/parkie', '#/assistant', '#/info']) { await visit(h); await compare(`guest ${h}`); }
await visit('#/home');
await compare('login window', async () => { await run(`document.getElementById('loginBtn')?.click(); true`); await wait(900); });
await run(`document.getElementById('closeAuthBtn')?.click(); true`);

// resident
await signIn('dev_resident');
for (const h of ['#/home', '#/map', '#/alerts', '#/community', '#/parkie', '#/assistant', '#/report', '#/info', '#/feedback', '#/profile']) { await visit(h); await compare(`resident ${h}`); }
for (const tab of ['wallet', 'settings']) {
  await visit('#/profile');
  await compare(`resident profile ${tab}`, clickAll(`#profileTabs [data-sec="${tab}"]`));
}
await visit('#/community');
for (const seg of ['events', 'forum', 'buddies']) {
  await compare(`resident community ${seg}`, async () => { await run(`(() => { const b = [...document.querySelectorAll('.segmented button')].find((x) => x.textContent.toLowerCase().includes('${seg === 'buddies' ? 'with' : seg}')); b?.click(); return !!b; })()`); await wait(1200); });
}
await run(`document.getElementById('userBtn')?.click(); true`);
await compare('account menu', async () => { await run(`document.getElementById('userBtn')?.click(); true`); await wait(600); });

// staff dashboard, every section
await signIn('dev_admin_mfa');
await visit('#/admin');
const sections = await run(`[...document.querySelectorAll('.dash-nav [data-section]')].map((b) => b.dataset.section)`);
for (const s of sections) {
  await compare(`admin ${s}`, async () => { await run(`document.querySelector('.dash-nav [data-section="${s}"]')?.click(); true`); await wait(3500); });
}
// the analytics page with the example numbers
await run(`document.querySelector('.dash-nav [data-section="analytics"]')?.click(); true`); await wait(2500);
await compare('admin analytics (example)', async () => { await run(`document.getElementById('anExample')?.click(); true`); await wait(1500); });

const rows = [...missing.entries()].sort((a, b) => [...a[1]][0].localeCompare([...b[1]][0]) || a[0].localeCompare(b[0]));
console.log(`\n${rows.length} pieces of text are the same in English and Romanian:\n`);
for (const [text, pages] of rows) console.log(`${JSON.stringify(text)}   <- ${[...pages].slice(0, 3).join(', ')}${pages.size > 3 ? ', …' : ''}`);
ws.close();
edge.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
process.exit(0);
