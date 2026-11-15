// Lists the English text in the app and the website that has no Romanian translation yet.
//   node scripts/i18n-audit.mjs            (everything)
//   node scripts/i18n-audit.mjs app | web   (one side)
//   node scripts/i18n-audit.mjs --json      (machine-readable)
// The Romanian dictionary is apps/app/src/core/i18n/ro.ts (shared with the website through apps/web/src/ro.js) plus
// apps/web/src/ro-web.js for text that exists only on the website. The scan is static: it reads JSX text and the common text
// props, and turns `${...}` into `{}` to match template entries. Text built in other ways can still slip through, so it is a
// strong check, not a proof.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const side = args.find((a) => a === 'app' || a === 'web') || 'all';
const asJson = args.includes('--json');

// ---- the dictionary
function loadRo() {
  let src = fs.readFileSync(path.join(root, 'apps/app/src/core/i18n/ro.ts'), 'utf8');
  src = src.replace(/^import .*$/m, 'let captured = {}; const registerDictionary = (_l, e) => { captured = e; };').replace(/:\s*\[string, string\]\[\]/g, '').replace(/:\s*Record<string, string>/g, '');
  return new Function(`${src}\nreturn captured;`)();
}
async function loadWebExtra() {
  const m = await import(pathToUrl(path.join(root, 'apps/web/src/ro-web.js')));
  return m.RO_WEB;
}
const pathToUrl = (p) => new URL(`file:///${p.replace(/\\/g, '/')}`).href;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function makeMatcher(entries) {
  const exact = new Set(Object.keys(entries).filter((k) => !k.includes('{}')));
  const templates = Object.keys(entries).filter((k) => k.includes('{}')).map((k) => new RegExp(`^${k.split('{}').map(escapeRe).join('(.+?)')}$`));
  return (text) => {
    const t = text.trim();
    return exact.has(t) || exact.has(text) || templates.some((re) => re.test(t));
  };
}

// ---- walking the source
function* files(dir, exts) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'build', '.expo'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* files(p, exts);
    else if (exts.some((x) => e.name.endsWith(x))) yield p;
  }
}

const PROPS = 'label|title|placeholder|accessibilityLabel|accessibilityHint|subtitle|detail|headline|message|note|description|hint|emptyText|caption|text|name|body|heading';
const looksLikeUi = (s) => {
  const t = s.trim();
  if (t.length < 3 || !/[A-Za-z]{3}/.test(t)) return false;
  if (/^(https?:|\/|#|[a-z]+:\/\/|[a-z0-9_.-]+\.(png|jpg|svg|json|js|ts))/i.test(t)) return false; // urls, paths, files
  if (/^[a-z][a-zA-Z0-9_-]*$/.test(t) && !t.includes(' ')) return false; // identifiers like "danger", "m05-transit"
  if (/^[A-Z0-9_]+$/.test(t)) return false; // CONSTANTS
  if (/[{}<>]|=>|\bfunction\b|\bconst\b|\bimport\b/.test(t.replace(/\{\}/g, ''))) return false; // code
  if (/^(font|flex|row|column|center|absolute|relative|none|auto|bold|solid|rgba?\()/.test(t)) return false;
  return true;
};
const clean = (s) => s.replace(/\$\{[^}]*\}/g, '{}').replace(/\s+/g, ' ').trim();

function scan(file, text, kind) {
  const found = [];
  const add = (s) => { const c = clean(s); if (looksLikeUi(c)) found.push(c); };
  const body = text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
  if (kind === 'tsx') {
    for (const m of body.matchAll(/>\s*([^<>{}\n][^<>{}]*?)\s*</g)) add(m[1]); // JSX text on one run
    for (const m of body.matchAll(/>\s*\n\s*([^<>{}\n][^<>{}]*?)\s*\n\s*</g)) add(m[1]); // JSX text across lines
    for (const m of body.matchAll(/\{\s*(['"`])([^'"`\n]+?)\1\s*\}/g)) add(m[2]); // {'text'}
  } else {
    for (const m of body.matchAll(/>\s*([^<>{}$`\n][^<>{}$`]*?)\s*</g)) add(m[1]); // HTML in template strings
  }
  for (const m of body.matchAll(new RegExp(`\\b(?:${PROPS})\\s*[=:]\\s*(?:\\{\\s*)?(['"\`])((?:(?!\\1)[^\\n\\\\])+)\\1`, 'g'))) add(m[2]);
  for (const m of body.matchAll(/(?:showToast\??\.?\(|toast\(|alert\()\s*(['"`])((?:(?!\1)[^\n\\])+)\1/g)) add(m[2]);
  return found.map((s) => ({ text: s, file: path.relative(root, file).replace(/\\/g, '/') }));
}

const ro = loadRo();
const webExtra = await loadWebExtra();
const inApp = makeMatcher(ro);
const inWeb = makeMatcher({ ...ro, ...webExtra });

const results = { app: [], web: [] };
if (side !== 'web') {
  for (const dir of ['apps/app/app', 'apps/app/src', 'packages/ui/src', 'packages/map/src']) {
    for (const f of files(path.join(root, dir), ['.tsx', '.ts'])) {
      if (/i18n[\\/]ro\.ts$|\.d\.ts$|engine\.generated|[\\/]mock[\\/]|\.test\./.test(f)) continue;
      const kind = f.endsWith('.tsx') ? 'tsx' : 'ts';
      results.app.push(...scan(f, fs.readFileSync(f, 'utf8'), kind).filter((x) => !inApp(x.text)));
    }
  }
}
if (side !== 'app') {
  for (const f of files(path.join(root, 'apps/web/src'), ['.js'])) {
    if (/[\\/](ro|ro-web|analyticsExample|art)\.js$/.test(f)) continue;
    results.web.push(...scan(f, fs.readFileSync(f, 'utf8'), 'js').filter((x) => !inWeb(x.text)));
  }
  results.web.push(...scan(path.join(root, 'apps/web/index.html'), fs.readFileSync(path.join(root, 'apps/web/index.html'), 'utf8'), 'js').filter((x) => !inWeb(x.text)));
}

const group = (list) => {
  const m = new Map();
  for (const x of list) { if (!m.has(x.text)) m.set(x.text, new Set()); m.get(x.text).add(x.file); }
  return [...m.entries()].map(([text, fs_]) => ({ text, files: [...fs_] })).sort((a, b) => a.files[0].localeCompare(b.files[0]) || a.text.localeCompare(b.text));
};
const out = { app: group(results.app), web: group(results.web) };
if (asJson) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }
for (const k of ['app', 'web']) {
  if (side !== 'all' && side !== k) continue;
  console.log(`\n=== ${k}: ${out[k].length} strings without Romanian ===`);
  let last = '';
  for (const x of out[k]) { if (x.files[0] !== last) { last = x.files[0]; console.log(`\n# ${last}`); } console.log(`  ${JSON.stringify(x.text)}`); }
}
process.exit(0);
