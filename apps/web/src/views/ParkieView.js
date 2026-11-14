import { fetchLots } from '../api.js';
import { esc, row } from '../ui.js';

export async function render(ctx) {
  const lots = await fetchLots();
  const cap = lots.reduce((a, l) => a + l.capacity, 0);
  const free = lots.reduce((a, l) => a + l.available_spots, 0);
  return `<div class="page">
    <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-end;flex-wrap:wrap">
      <div><h1 class="page-title">Parking</h1><p class="page-sub">Live free spots in ${lots.length} lots, counted from camera feeds.</p></div>
      ${ctx.staff ? `<button class="btn btn-secondary" data-goto="admin">Calibrate cameras</button>` : ''}
    </div>
    <div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="stat"><b style="color:var(--mint)">${free}</b><span>Free spots</span></div>
      <div class="stat"><b>${cap}</b><span>Total capacity</span></div>
      <div class="stat"><b style="color:var(--blue)">${lots.length}</b><span>Lots monitored</span></div>
    </div>
    <div class="list section" style="margin-top:32px">${lots.map((l) => row({
      num: l.available_spots, numTone: l.status_color === 'red' ? 'apricot' : 'mint', title: esc(l.name),
      detail: `of ${l.capacity} spots free · ${l.latitude.toFixed(3)}, ${l.longitude.toFixed(3)}`,
      meter: { pct: (l.available_spots / l.capacity) * 100, color: l.status_color === 'red' ? 'red' : l.status_color === 'yellow' ? 'yellow' : '' },
    })).join('')}</div>
  </div>`;
}
export const mount = () => () => {};
