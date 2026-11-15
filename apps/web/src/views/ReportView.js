import { hubGet, hubPost } from '../api.js';
import { art, esc } from '../ui.js';

const KINDS = {
  smell: {
    label: 'Smell', art: 'smell', ask: 'What did you notice?',
    types: [['burnt_rubber', 'Burnt rubber'], ['smoke', 'Smoke'], ['sewage', 'Sewage'], ['chemical', 'Chemical'], ['garbage', 'Garbage'], ['other', 'Other']],
    intro: 'One tap and you have reported it. The data helps the city find the source.',
    thanks: 'Your report is on the map. The more neighbours report, the clearer the picture.',
  },
  safety: {
    label: 'Safety', art: 'safety', ask: 'What did you notice?',
    types: [['poor_lighting', 'Poor lighting'], ['noise_at_night', 'Noise at night'], ['abandoned_building', 'Abandoned building'], ['feeling_unsafe', 'Feeling unsafe'], ['other', 'Other']],
    intro: 'Tell us about problems with a place: light, noise, empty buildings, spots where you do not feel safe.',
    thanks: 'Your report is on the map. The more neighbours report, the clearer the picture.',
  },
};

/** Report a problem: a smell, or a place that feels unsafe. Residents' reports, shown on the map and counted by area. */
export async function render(ctx) {
  if (!ctx.loggedIn) return `<div class="page"><div class="door"><div><h1>Report a problem</h1><p>Log in to send a report. Reports are anonymous to your neighbours.</p><button class="btn btn-primary" data-login>Log in</button></div></div></div>`;
  return `<div class="page wide">
    <h1 class="page-title">Report a problem</h1>
    <p class="page-sub" id="rIntro"></p>
    <div class="cols section">
      <div>
        <div class="segmented" role="tablist" aria-label="Kind of report" id="rKind">${Object.entries(KINDS).map(([k, c], i) => `<button role="tab" data-kind="${k}" class="${i === 0 ? 'on' : ''}">${c.label}</button>`).join('')}</div>
        <form class="stack" id="rForm" style="margin-top:18px">
          <div><div class="muted" id="rAsk" style="font-size:13px;font-weight:600;margin-bottom:8px"></div><div class="pills" id="rTypes" role="group"></div></div>
          <div id="rStrengthBox"><div class="muted" style="font-size:13px;font-weight:600;margin-bottom:8px">How strong?</div><div class="pills" id="rStrength" role="group" aria-label="Strength from 1 to 5">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="pill ${n === 3 ? 'on' : ''}" data-s="${n}">${n}</button>`).join('')}</div></div>
          <label class="field"><span>Where?</span><select id="rArea" required><option value="">Choose a neighbourhood</option></select></label>
          <label class="field" id="rNoteBox" hidden><span>Note (optional)</span><textarea id="rNote" rows="2" maxlength="300" placeholder="Describe the place, not the people. No names or contact details."></textarea></label>
          <div><button class="btn btn-primary" type="submit" id="rSend">Send report</button></div>
          <div class="result" id="rResult" hidden aria-live="polite"></div>
        </form>
      </div>
      <div>
        <div class="section-head"><h2>Reports by area, last 24 hours</h2></div>
        <div class="list" id="rAreas"><div class="empty">Loading…</div></div>
        <p class="muted" style="font-size:13px;margin-top:10px">Residents' reports about places, unverified. They are not police statistics.</p>
      </div>
    </div>
  </div>`;
}

export function mount(ctx, { showToast } = {}) {
  if (!ctx.loggedIn) return;
  const $ = (id) => document.getElementById(id);
  let kind = 'smell';
  let type = '';
  let strength = 3;

  const drawKind = () => {
    const c = KINDS[kind];
    type = '';
    $('rIntro').textContent = c.intro;
    $('rAsk').textContent = c.ask;
    $('rTypes').innerHTML = c.types.map(([id, label]) => `<button type="button" class="pill" data-type="${id}">${label}</button>`).join('');
    $('rStrengthBox').hidden = kind !== 'smell';
    $('rNoteBox').hidden = kind !== 'safety';
    $('rResult').hidden = true;
    document.querySelectorAll('#rKind button').forEach((b) => b.classList.toggle('on', b.dataset.kind === kind));
    $('rTypes').querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => {
      type = b.dataset.type;
      $('rTypes').querySelectorAll('[data-type]').forEach((x) => x.classList.toggle('on', x === b));
    }));
  };
  document.querySelectorAll('#rKind button').forEach((b) => b.addEventListener('click', () => { kind = b.dataset.kind; drawKind(); }));
  $('rStrength').querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
    strength = Number(b.dataset.s);
    $('rStrength').querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  drawKind();

  hubGet('/v1/core/areas').then((areas) => {
    $('rArea').insertAdjacentHTML('beforeend', (areas || []).map((a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join(''));
  }).catch(() => {});

  const loadAreas = () => hubGet('/v1/m/smell/areas?hours=24&includeDemo=true').then((r) => {
    const rows = (r.areas || []).slice(0, 8);
    $('rAreas').innerHTML = rows.map((a) => `<div class="row"><div class="art">${art('smell', 44)}</div><div class="body"><div class="title">${esc(a.areaName)}</div><div class="detail">${esc(a.count)} reports · mostly ${esc(String(a.dominantType).replace(/_/g, ' '))}</div></div></div>`).join('') || '<div class="empty">No reports in the last 24 hours</div>';
  }).catch(() => { $('rAreas').innerHTML = '<div class="empty">Could not load the reports.</div>'; });
  loadAreas();

  $('rForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = $('rResult');
    out.hidden = false;
    if (!type || !$('rArea').value) { out.innerHTML = '<b class="bad">Choose what you noticed and where.</b>'; return; }
    $('rSend').disabled = true;
    const body = { type, areaId: $('rArea').value };
    if (kind === 'smell') body.intensity = strength;
    else if ($('rNote').value.trim()) body.note = $('rNote').value.trim();
    try {
      await hubPost(`/v1/m/${kind}/reports`, body);
      out.innerHTML = `<b class="ok">Thank you!</b><p style="margin-top:4px">${esc(KINDS[kind].thanks)}</p>`;
      showToast?.('Report sent.');
      if (kind === 'smell') loadAreas();
    } catch (err) {
      out.innerHTML = `<b class="bad">Could not send. Try again.</b><p style="margin-top:4px">${esc(err.message)}</p>`;
    } finally {
      $('rSend').disabled = false;
    }
  });
}
