import { checkAddressOutages, checkTransitStop, fetchOutages, fetchTransitLines } from '../api.js';
import { art, cap, esc, row, statusText } from '../ui.js';
import { CITY } from '../city.js';

export async function render() {
  const [outages, lines] = await Promise.all([fetchOutages(), fetchTransitLines()]);
  const statusTag = (s) => (s === 'normal' ? '<span class="tag mint">Normal</span>' : s === 'suspended' ? '<span class="tag danger">Suspended</span>' : '<span class="tag apricot">Rerouted</span>');
  return `<div class="page">
    <h1 class="page-title">City alerts</h1>
    <p class="page-sub">Outages and transit changes across ${esc(CITY.name)}, and a quick way to check your own street or stop.</p>
    <div class="cols section">
      <div>
        <div class="section-head"><h2>Outages (${outages.length})</h2></div>
        <div class="list">${outages.map((o) => row({
          art: art('utilities', 52), title: esc(o.title),
          detail: `${esc(o.description)}<br><span class="muted">${esc(cap(o.provider))} · ${esc((o.affected_areas || []).join(', '))}${o.estimated_restore_time ? ` · back about ${new Date(o.estimated_restore_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>`,
          side: `<span class="tag ${o.severity === 'critical' ? 'danger' : 'apricot'}">${esc(statusText(o.status))}</span>`,
        })).join('') || '<div class="empty">No active outages.</div>'}</div>

        <div class="section"><div class="section-head"><h2>Transit (${lines.length} lines)</h2></div>
        <div class="list">${lines.map((l) => row({
          art: art('transit', 52), title: `Line ${esc(l.line_number)}: ${esc(l.name)}`,
          detail: esc(l.detour_alert ? `${l.detour_alert.title}. ${l.current_route_summary || ''}` : l.current_route_summary || 'Normal route'),
          side: statusTag(l.status),
        })).join('')}</div></div>
      </div>
      <div>
        <div class="checker"><h3>Is my street affected?</h3><p>Check heating and water outages by street or neighbourhood.</p>
          <div class="row-inline"><label class="field"><span>Address</span><input id="addressInput" placeholder="Strada Circumvalațiunii 14"></label><button class="btn btn-ink btn-md" id="checkAddressBtn">Check</button></div>
          <div class="result" id="addressResult" hidden></div></div>
        <div class="checker"><h3>Is my stop affected?</h3><p>See whether a tram or bus stop is on a detour.</p>
          <div class="row-inline"><label class="field"><span>Stop</span><input id="stationInput" placeholder="Calea Bogdăneștilor"></label><button class="btn btn-ink btn-md" id="checkStationBtn">Check</button></div>
          <div class="result" id="stationResult" hidden></div></div>
      </div>
    </div>
  </div>`;
}

export function mount() {
  const wire = (btnId, inputId, resultId, fn, bad) => {
    const btn = document.getElementById(btnId), input = document.getElementById(inputId), out = document.getElementById(resultId);
    const run = async () => {
      const v = input.value.trim();
      if (!v) return;
      btn.disabled = true;
      const res = await fn(v);
      const isBad = bad(res);
      out.hidden = false;
      out.innerHTML = `<b class="${isBad ? 'bad' : 'ok'}">${isBad ? 'Affected' : 'All clear'}</b><p style="margin-top:4px">${esc(res.message || '')}</p>`;
      btn.disabled = false;
    };
    btn.addEventListener('click', run);
    input.addEventListener('keydown', (e) => e.key === 'Enter' && run());
  };
  wire('checkAddressBtn', 'addressInput', 'addressResult', checkAddressOutages, (r) => r.affected);
  wire('checkStationBtn', 'stationInput', 'stationResult', checkTransitStop, (r) => r.detour);
  return () => {};
}
