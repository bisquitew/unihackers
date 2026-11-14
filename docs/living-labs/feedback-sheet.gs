/**
 * Living Labs survey → clean tab → summary tab → (optional) our API.
 *
 * Lives in the Google Sheet linked to the survey form (Extensions → Apps Script).
 * Setup steps: docs/living-labs/README.md
 *
 * What it does on every form submission:
 *   1. reads the new row from the form's responses tab
 *   2. normalises it (roles → ids, scales → numbers, options → module ids) into the "clean" tab
 *   3. rebuilds the "summary" tab (overall numbers, numbers per app version, per-module votes)
 *   4. if FORWARD_ENABLED = true, POSTs it to our API (M11 feedback) so survey and in-app
 *      feedback end up in one table
 *
 * Script properties (Project Settings → Script properties):
 *   APP_VERSION      current app version, e.g. v0.3. Stamped on every response so we can
 *                    show before/after numbers per version. Also settable from the menu.
 *   FORWARD_ENABLED  "true" to send to the API. Leave unset until P2's API is live.
 *   API_URL          e.g. https://<api-host>/v1/m/feedback/ingest
 *   API_TOKEN        same value as FEEDBACK_INGEST_TOKEN in the API's .env (sent as "X-Ingest-Token")
 *
 * The email answer (Q12) is never copied or sent anywhere; only has_email = true/false.
 */

const CLEAN_SHEET = 'clean';
const SUMMARY_SHEET = 'summary';

// Each module: keyword in the Q3 grid row label (problem) and in the Q4/Q5/Q8 options (feature).
// Keywords are matched in lowercase against the English part of the labels in survey.md.
const MODULES = [
  { id: 'm01-events',       problem: 'small events',          feature: 'small events' },
  { id: 'm02-visitor-info', problem: 'practical info',        feature: 'practical info' },
  { id: 'm03-safety',       problem: 'safe in some areas',    feature: 'unsafe' },
  { id: 'm04-utilities',    problem: 'heating',               feature: 'alerts for heat' },
  { id: 'm05-transit',      problem: 'tram and bus changes',  feature: 'tram and bus' },
  { id: 'm06-smell',        problem: 'bad smells',            feature: 'bad smells' },
  { id: 'm07-buddy',        problem: 'no one to go',          feature: 'someone to go' },
  { id: 'm08-forum',        problem: 'ask neighbours',        feature: 'forum' },
  { id: 'parkie',           problem: 'parking',               feature: 'parking' },
  { id: 'm10-assistant',    problem: null,                    feature: 'assistant' },
];

// Lowercase start of each question title (English part).
const Q = {
  role: 'who are you',
  city: 'which city',
  age: 'age',
  problems: 'how much does each problem',
  wanted: 'which features would you use',
  top: 'which one would you use most',
  install: 'how likely are you to install',
  tried: 'have you tried our app',
  triedParts: 'which part did you try',
  appRating: 'how good is the app',
  confusing: 'what was confusing',
  missing: 'what is missing or what would you change',
  email: 'email if you want',
};

const CLEAN_HEADERS = [
  'response_id', 'submitted_at', 'app_version', 'source', 'role', 'role_other', 'city', 'age',
  'install_likelihood', 'top_feature', 'wanted_features', 'tried_app', 'tried_parts',
  'app_rating', 'confusing', 'missing', 'has_email',
]
  .concat(MODULES.filter((m) => m.problem).map((m) => 'p_' + m.id))
  .concat(['forwarded']);

// ---------------------------------------------------------------- entry points

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Living Labs')
    .addItem('Process all responses', 'processAll')
    .addItem('Rebuild summary', 'buildSummary')
    .addItem('Set app version…', 'promptAppVersion')
    .addItem('Retry failed API sends', 'retryForwards')
    .addToUi();
}

/** Installable trigger: From spreadsheet → On form submit. */
function onFormSubmit(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const raw = e && e.range ? e.range.getSheet() : getRawSheet_();
    const row = e && e.range ? e.range.getRow() : raw.getLastRow();
    processRow_(raw, row, existingIds_());
    buildSummary();
  } finally {
    lock.releaseLock();
  }
}

/** Processes every response not yet in the clean tab (safe to run any time). */
function processAll() {
  const raw = getRawSheet_();
  const ids = existingIds_();
  for (let r = 2; r <= raw.getLastRow(); r++) processRow_(raw, r, ids);
  buildSummary();
}

function promptAppVersion() {
  const ui = SpreadsheetApp.getUi();
  const current = prop_('APP_VERSION') || 'v0';
  const res = ui.prompt('App version', 'Current: ' + current + '\nNew version (e.g. v0.4):', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const v = res.getResponseText().trim();
  if (v) PropertiesService.getScriptProperties().setProperty('APP_VERSION', v);
}

/** Re-sends rows whose "forwarded" column is not "yes". */
function retryForwards() {
  if (!forwardingOn_()) {
    SpreadsheetApp.getActive().toast('Forwarding is off (set FORWARD_ENABLED and API_URL).');
    return;
  }
  const clean = getCleanSheet_();
  const data = clean.getDataRange().getValues();
  const headers = data[0];
  const fwdCol = headers.indexOf('forwarded');
  let sent = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][fwdCol] === 'yes') continue;
    const rec = rowToObject_(headers, data[i]);
    const status = forward_(rec);
    clean.getRange(i + 1, fwdCol + 1).setValue(status);
    if (status === 'yes') sent++;
  }
  SpreadsheetApp.getActive().toast('Sent ' + sent + ' row(s).');
}

// ---------------------------------------------------------------- processing

function processRow_(raw, rowNum, ids) {
  const id = 'survey-' + rowNum;
  if (ids.has(id)) return;
  const width = raw.getLastColumn();
  const headers = raw.getRange(1, 1, 1, width).getValues()[0].map((h) => String(h).trim().toLowerCase());
  const values = raw.getRange(rowNum, 1, 1, width).getValues()[0];
  if (!values[0]) return; // empty row

  const rec = toRecord_(headers, values, id);
  rec.forwarded = forward_(rec);
  getCleanSheet_().appendRow(CLEAN_HEADERS.map((h) => (rec[h] === undefined ? '' : rec[h])));
  ids.add(id);
}

function toRecord_(headers, values, id) {
  const get = (needle) => {
    const i = headers.findIndex((h) => h.startsWith(needle));
    return i < 0 ? '' : values[i];
  };
  const text = (needle) => String(get(needle) || '').trim();

  const roleRaw = text(Q.role);
  const tried = text(Q.tried).toLowerCase().startsWith('yes');

  const rec = {
    response_id: id,
    submitted_at: values[0], // "Timestamp" column
    app_version: prop_('APP_VERSION') || 'v0',
    source: 'survey',
    role: mapRole_(roleRaw),
    role_other: '',
    city: mapCity_(text(Q.city)),
    age: text(Q.age).split('/')[0].trim(),
    install_likelihood: scale_(get(Q.install)),
    top_feature: matchModules_(text(Q.top))[0] || '',
    wanted_features: matchModules_(text(Q.wanted)).join(';'),
    tried_app: tried,
    tried_parts: tried ? matchModules_(text(Q.triedParts)).join(';') : '',
    app_rating: tried ? scale_(get(Q.appRating)) : '',
    confusing: text(Q.confusing),
    missing: text(Q.missing),
    has_email: text(Q.email) !== '',
  };
  if (rec.role === 'other') rec.role_other = roleRaw;

  // Grid columns look like: "how much does each problem affect you? / ... [row label]"
  headers.forEach((h, i) => {
    if (!h.startsWith(Q.problems)) return;
    const rowLabel = (h.match(/\[(.*)\]\s*$/) || [])[1] || '';
    const mod = MODULES.find((m) => m.problem && rowLabel.includes(m.problem));
    if (mod) rec['p_' + mod.id] = scale_(values[i]);
  });
  return rec;
}

function mapRole_(s) {
  const t = s.toLowerCase();
  if (t.includes('international')) return 'intl_student';
  if (t.includes('student')) return 'student';
  if (t.includes('resident')) return 'resident';
  if (t.includes('new to the city')) return 'newcomer';
  if (t.includes('visitor')) return 'visitor';
  return 'other';
}

function mapCity_(s) {
  const t = s.toLowerCase();
  if (!t) return '';
  if (t.includes('timi')) return 'timisoara';
  if (t.includes('romania')) return 'other_romania';
  if (t.includes('another country')) return 'abroad';
  return 'other';
}

/** Checkbox answers contain commas inside labels, so we match keywords instead of splitting. */
function matchModules_(s) {
  const t = String(s).toLowerCase();
  return MODULES.filter((m) => m.feature && t.includes(m.feature)).map((m) => m.id);
}

function scale_(v) {
  const m = String(v).match(/\d/);
  return m ? Number(m[0]) : '';
}

// ---------------------------------------------------------------- API forwarding

function forwardingOn_() {
  return prop_('FORWARD_ENABLED') === 'true' && !!prop_('API_URL');
}

function forward_(rec) {
  if (!forwardingOn_()) return 'off';
  const token = prop_('API_TOKEN');
  try {
    const res = UrlFetchApp.fetch(prop_('API_URL'), {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(toPayload_(rec)),
      // Not "Authorization: Bearer": the API's global Auth0 middleware rejects non-Auth0 bearer tokens.
      headers: token ? { 'X-Ingest-Token': token } : {},
      muteHttpExceptions: true,
    });
    const code = res.getResponseCode();
    return code >= 200 && code < 300 ? 'yes' : 'error ' + code;
  } catch (err) {
    return 'error ' + err.message;
  }
}

/** Shape the M11 feedback API must accept (source = "survey"). */
function toPayload_(rec) {
  const problemScores = {};
  MODULES.forEach((m) => {
    const v = rec['p_' + m.id];
    if (v !== '' && v !== undefined && v !== null) problemScores[m.id] = Number(v);
  });
  const list = (s) => (s ? String(s).split(';').filter(String) : []);
  const num = (v) => (v === '' || v === undefined || v === null ? null : Number(v));
  return {
    source: 'survey',
    externalId: rec.response_id,
    submittedAt: new Date(rec.submitted_at).toISOString(),
    appVersion: String(rec.app_version),
    role: rec.role,
    ageRange: rec.age || null,
    installLikelihood: num(rec.install_likelihood),
    topFeature: rec.top_feature || null,
    wantedFeatures: list(rec.wanted_features),
    triedApp: rec.tried_app === true || String(rec.tried_app).toUpperCase() === 'TRUE',
    triedParts: list(rec.tried_parts),
    appRating: num(rec.app_rating),
    problemScores: problemScores,
    text: { confusing: rec.confusing || '', missing: rec.missing || '' },
  };
}

// ---------------------------------------------------------------- summary

function buildSummary() {
  const data = getCleanSheet_().getDataRange().getValues();
  const headers = data.shift();
  const rows = data.map((r) => rowToObject_(headers, r));
  const isTrue = (v) => v === true || String(v).toUpperCase() === 'TRUE';
  const avg = (xs) => {
    const n = xs.filter((x) => x !== '' && x !== null && x !== undefined).map(Number);
    return n.length ? Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 100) / 100 : '';
  };
  const tried = rows.filter((r) => isTrue(r.tried_app));

  const out = [];
  out.push(['OVERALL', '', '', '']);
  out.push(['Responses', rows.length, '', '']);
  out.push(['Avg install likelihood (1–5)', avg(rows.map((r) => r.install_likelihood)), '', '']);
  out.push(['Tried the app', tried.length, '', '']);
  out.push(['Avg app rating (1–5, testers only)', avg(tried.map((r) => r.app_rating)), '', '']);
  out.push(['', '', '', '']);

  out.push(['BY APP VERSION', 'responses', 'avg install', 'avg app rating']);
  const versions = [];
  rows.forEach((r) => { if (versions.indexOf(String(r.app_version)) < 0) versions.push(String(r.app_version)); });
  versions.forEach((v) => {
    const vr = rows.filter((r) => String(r.app_version) === v);
    const vt = vr.filter((r) => isTrue(r.tried_app));
    out.push([v, vr.length, avg(vr.map((r) => r.install_likelihood)), avg(vt.map((r) => r.app_rating))]);
  });
  out.push(['', '', '', '']);

  out.push(['BY CITY', 'responses', 'avg install', 'avg app rating']);
  const cities = [];
  rows.forEach((r) => { const c = String(r.city || '(not asked)'); if (cities.indexOf(c) < 0) cities.push(c); });
  cities.forEach((c) => {
    const cr = rows.filter((r) => String(r.city || '(not asked)') === c);
    const ct = cr.filter((r) => isTrue(r.tried_app));
    out.push([c, cr.length, avg(cr.map((r) => r.install_likelihood)), avg(ct.map((r) => r.app_rating))]);
  });
  out.push(['', '', '', '']);

  out.push(['MODULE', 'avg problem score (1–5)', 'would use (votes)', 'top pick (votes)']);
  MODULES
    .map((m) => [
      m.id,
      m.problem ? avg(rows.map((r) => r['p_' + m.id])) : '',
      rows.filter((r) => String(r.wanted_features).split(';').indexOf(m.id) >= 0).length,
      rows.filter((r) => r.top_feature === m.id).length,
    ])
    .sort((a, b) => b[2] - a[2])
    .forEach((r) => out.push(r));

  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SUMMARY_SHEET) || ss.insertSheet(SUMMARY_SHEET);
  sheet.clearContents();
  sheet.getRange(1, 1, out.length, 4).setValues(out);
  sheet.getRange('A1:D1').setFontWeight('bold');
}

// ---------------------------------------------------------------- helpers

function getRawSheet_() {
  const sheet = SpreadsheetApp.getActive().getSheets().find((s) => s.getFormUrl());
  if (!sheet) throw new Error('No tab linked to a Google Form. Link the form first (Form → Responses → Link to Sheets).');
  return sheet;
}

function getCleanSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(CLEAN_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CLEAN_SHEET);
    sheet.appendRow(CLEAN_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CLEAN_HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function existingIds_() {
  const sheet = getCleanSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return new Set();
  return new Set(sheet.getRange(2, 1, last - 1, 1).getValues().map((r) => String(r[0])));
}

function rowToObject_(headers, row) {
  const o = {};
  headers.forEach((h, i) => { o[h] = row[i]; });
  return o;
}

function prop_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}
