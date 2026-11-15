// Small SVG/HTML charts in the hop look: hairlines, ink text, colour only where it means something.
// Hue meaning (same as the rest of hop): blue = getting around and information, mint = people and services,
// apricot = safety and warnings. Every chart also states its numbers as text, so it can be read without seeing it.
import { esc } from '../ui.js';
import { tr } from '../i18n.js';

/** The part of the app each module belongs to, as a hue. */
const HUE = {
  'm01-events': 'mint', 'm07-buddy': 'mint', 'm08-forum': 'mint', 'm09-wallet': 'mint',
  'm05-transit': 'blue', 'm02-visitor-info': 'blue', 'm10-assistant': 'blue', parkie: 'blue',
  'm03-safety': 'apricot', 'm06-smell': 'apricot', 'm04-utilities': 'apricot',
};
export const hueOf = (id) => HUE[id] || 'ink';

export const MODULE_LABEL = {
  'm01-events': 'Events', 'm02-visitor-info': 'Visitor info', 'm03-safety': 'Safety', 'm04-utilities': 'Outages',
  'm05-transit': 'Transit', 'm06-smell': 'Smell reports', 'm07-buddy': 'Buddies', 'm08-forum': 'Forum',
  'm09-wallet': 'Wallet', 'm10-assistant': 'Assistant', parkie: 'Parking',
};
export const moduleLabel = (id) => MODULE_LABEL[id] || String(id).replace(/^m\d+-/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

// slices of the same hue get lighter so neighbours can be told apart
const SHADES = [1, 0.62, 0.38, 0.22];
function shadeFor(items, i, hueFn) {
  const hue = hueFn(items[i]);
  const before = items.slice(0, i).filter((x) => hueFn(x) === hue).length;
  return { hue, opacity: SHADES[Math.min(before, SHADES.length - 1)] };
}
// chart fills are the bright illustration hues (text colours like --mint are darker, to read on white)
const colorVar = (hue) => `var(--chart-${hue})`;

/**
 * A donut. `items`: [{ label, value (percent), hue? }]. Slices are coloured by `hue` when given, else in the order
 * mint / blue / apricot / ink. The legend lists the percentages.
 */
export function donut(items, { title, centre } = {}) {
  const cycle = ['mint', 'blue', 'apricot', 'ink'];
  const hueFn = (it) => it.hue || cycle[items.indexOf(it) % cycle.length];
  const total = items.reduce((t, i) => t + i.value, 0) || 1;
  let offset = 25; // start at 12 o'clock
  const gap = items.length > 1 ? 0.7 : 0;
  const arcs = items.map((it, i) => {
    const len = (it.value / total) * 100;
    const { hue, opacity } = shadeFor(items, i, hueFn);
    const dash = Math.max(0, len - gap);
    const svg = `<circle cx="21" cy="21" r="15.9155" fill="none" stroke-width="6" style="stroke:${colorVar(hue)};opacity:${opacity}" stroke-dasharray="${dash} ${100 - dash}" stroke-dashoffset="${offset}"/>`;
    offset -= len;
    return { svg, hue, opacity };
  });
  const aria = `${tr(title || 'Chart')}: ${items.map((i) => `${tr(i.label)} ${i.value}%`).join(', ')}`;
  return `<div class="donut">
    <svg viewBox="0 0 42 42" role="img" aria-label="${esc(aria)}"><circle cx="21" cy="21" r="15.9155" fill="none" stroke-width="6" style="stroke:var(--hair)"/>${arcs.map((a) => a.svg).join('')}</svg>
    ${centre ? `<div class="donut-centre"><b>${esc(centre.big)}</b><span>${esc(centre.small)}</span></div>` : ''}
  </div>
  <ul class="legend">${items.map((it, i) => `<li><i style="background:${colorVar(arcs[i].hue)};opacity:${arcs[i].opacity}"></i><span>${esc(it.label)}</span><b>${esc(it.value)}%</b></li>`).join('')}</ul>`;
}

/** Horizontal bars. `rows`: [{ label, value, hue? }]; `max` is the value that fills the bar; `format` writes the number. */
export function bars(rows, { max = 100, format = (v) => `${v}%`, title } = {}) {
  if (!rows.length) return '';
  const aria = `${tr(title || 'Chart')}: ${rows.map((r) => `${tr(r.label)} ${format(r.value)}`).join(', ')}`;
  return `<div class="bars" role="img" aria-label="${esc(aria)}">${rows.map((r) => `
    <div class="bar-row"><span class="bar-label">${esc(r.label)}</span>
      <div class="bar-track"><i style="width:${Math.max(2, Math.min(100, (r.value / max) * 100))}%;background:${colorVar(r.hue || 'blue')}"></i></div>
      <b class="bar-value">${esc(format(r.value))}</b></div>`).join('')}</div>`;
}

/** Vertical columns. `cols`: [{ label, value, hue? }]. */
export function columns(cols, { max = 100, format = (v) => `${v}%`, title } = {}) {
  if (!cols.length) return '';
  const aria = `${tr(title || 'Chart')}: ${cols.map((c) => `${tr(c.label)} ${format(c.value)}`).join(', ')}`;
  return `<div class="cols-chart" role="img" aria-label="${esc(aria)}">${cols.map((c) => `
    <div class="col-item"><b>${esc(format(c.value))}</b>
      <div class="col-track"><i style="height:${Math.max(2, Math.min(100, (c.value / max) * 100))}%;background:${colorVar(c.hue || 'blue')}"></i></div>
      <span>${esc(c.label)}</span></div>`).join('')}</div>`;
}
