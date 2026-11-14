import { fetchEvents, fetchLots, fetchOutages, fetchSmellPins } from '../api.js';
import { art, esc } from '../ui.js';
import { buildLayers, createMap } from '../mapEngine.js';

export async function render() {
  return `<div class="map-page" id="mapPage">
    <aside class="map-panel" aria-label="Map layers">
      <h2>On the map</h2>
      <p class="muted" style="font-size:14px;margin-top:2px">Choose what to show, or pick a place.</p>
      <div class="scroll" id="mapScroll"><div class="empty">Loading the city…</div></div>
    </aside>
  </div>`;
}

export function mount() {
  const page = document.getElementById('mapPage');
  const scroll = document.getElementById('mapScroll');
  let layers = {};
  const hidden = {};
  let selected = null;

  const map = createMap(page, { onPinPress: (id) => pick(id) });

  const visiblePins = () => Object.entries(layers).filter(([k]) => !hidden[k]).flatMap(([, l]) => l.pins);
  const pushPins = () => map.setPins(visiblePins());

  function pick(id) {
    selected = visiblePins().find((p) => p.id === id) || null;
    map.select(selected ? selected.id : null);
    if (selected) map.flyTo(selected.lat, selected.lng, 16);
    draw();
  }

  function draw() {
    const layerRows = Object.entries(layers).map(([key, l]) => `
      <div class="layer-row">
        <div class="art">${art(l.art, 44)}</div>
        <div class="body"><div class="title">${esc(l.title)}</div><div class="detail">${l.pins.length} ${l.pins.length === 1 ? 'place' : 'places'}</div></div>
        <label class="switch"><input type="checkbox" data-layer="${key}" ${hidden[key] ? '' : 'checked'} aria-label="${esc(l.title)}"><i></i></label>
      </div>`).join('');
    const places = visiblePins().slice(0, 40).map((p) => `
      <button class="row" data-pin="${esc(p.id)}" style="padding:12px 4px">
        <div class="art" style="width:40px;height:40px">${art(p.art, 40)}</div>
        <div class="body"><div class="title">${esc(p.title)}</div><div class="detail">${esc(p.kindLabel)}</div></div>
      </button>`).join('');
    scroll.innerHTML = `${layerRows}
      ${selected ? `<div class="pin-detail"><div class="head">${art(selected.art, 52)}<div><h3>${esc(selected.title)}</h3><div class="muted">${esc(selected.kindLabel)}</div></div></div></div>` : ''}
      <h3 style="font-size:17px;margin:18px 0 4px">Places</h3><div class="list">${places || '<div class="empty">Nothing shown.</div>'}</div>`;
    scroll.querySelectorAll('[data-layer]').forEach((el) => el.addEventListener('change', () => {
      hidden[el.dataset.layer] = !el.checked;
      if (selected && !visiblePins().some((p) => p.id === selected.id)) selected = null;
      pushPins();
      draw();
    }));
    scroll.querySelectorAll('[data-pin]').forEach((el) => el.addEventListener('click', () => pick(el.dataset.pin)));
  }

  Promise.all([fetchLots(), fetchOutages(), fetchEvents(), fetchSmellPins()]).then(([lots, outages, events, smell]) => {
    layers = buildLayers({ lots, outages, events, smell: smell.pins || [] });
    pushPins();
    map.overview();
    draw();
  });
  return () => map.destroy();
}
