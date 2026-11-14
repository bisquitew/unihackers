import { fetchEvents, fetchLots, fetchOutages, fetchSmellPins, fetchAreaAlerts } from '../api.js';
import { art, esc, icons } from '../ui.js';
import { buildLayers, createMap } from '../mapEngine.js';

export async function render() {
  return `<div class="map-page" id="mapPage">
    <aside class="map-panel" aria-label="Map layers">
      <h2>On the map</h2>
      <p class="muted" style="font-size:14px;margin-top:2px">Choose what to show, or pick a place.</p>
      <div class="scroll" id="mapScroll"><div class="empty">Loading the city…</div></div>
    </aside>
    <button class="locate-btn" id="locateBtn" aria-label="Show where I am">${icons.locate}</button>
  </div>`;
}

export function mount(ctx, { showToast } = {}) {
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
    if (selected) {
      const radius = selected.radiusMeters || 0;
      const zoom = radius >= 1000 ? 13.8 : radius >= 600 ? 14.4 : radius >= 300 ? 15.2 : 16;
      map.flyTo(selected.lat, selected.lng, zoom);
    }
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
      ${selected ? `<div class="pin-detail"><div class="head">${art(selected.art, 52)}<div><h3>${esc(selected.title)}</h3><div class="muted">${esc(selected.kindLabel)}</div>${selected.radiusMeters ? `<div style="margin-top:6px;padding:4px 8px;border-radius:6px;background:${selected.zoneType === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'};border:1px solid ${selected.zoneType === 'danger' ? '#ef4444' : '#f59e0b'};font-size:12px;font-weight:700;color:${selected.zoneType === 'danger' ? '#fca5a5' : '#fcd34d'}">⭕ Rază perimetru: ${selected.radiusMeters}m (${selected.zoneType === 'danger' ? 'Pericol ISU' : 'Șantier'})</div>` : ''}</div></div></div>` : ''}
      <h3 style="font-size:17px;margin:18px 0 4px">Places</h3><div class="list">${places || '<div class="empty">Nothing shown.</div>'}</div>`;
    scroll.querySelectorAll('[data-layer]').forEach((el) => el.addEventListener('change', () => {
      hidden[el.dataset.layer] = !el.checked;
      if (selected && !visiblePins().some((p) => p.id === selected.id)) selected = null;
      pushPins();
      draw();
    }));
    scroll.querySelectorAll('[data-pin]').forEach((el) => el.addEventListener('click', () => pick(el.dataset.pin)));
  }

  const getTarget = () => {
    const raw = location.hash || '';
    const m = raw.match(/[?&](?:alert|pin)=([^&]+)/);
    if (m) return decodeURIComponent(m[1]);
    const parts = raw.split('/');
    if (parts.length >= 3 && parts[2]) return parts[2];
    return null;
  };

  const applyTarget = () => {
    const target = getTarget();
    if (!target) return false;
    const pinId = target.startsWith('area-') ? target : `area-${target}`;
    const found = visiblePins().find((p) => p.id === pinId || p.id === target);
    if (found) {
      pick(found.id);
      return true;
    }
    return false;
  };

  const onHash = () => {
    applyTarget();
  };
  window.addEventListener('hashchange', onHash);

  // "you are here": the first press asks the browser for the position, then follows it; every press centres the map on you
  let watchId = null;
  let mine = null;
  const locateBtn = document.getElementById('locateBtn');
  const update = (pos) => {
    const h = pos.coords.heading;
    mine = { lat: pos.coords.latitude, lng: pos.coords.longitude, heading: typeof h === 'number' && !Number.isNaN(h) ? h : undefined };
    map.setUserLocation(mine);
  };
  locateBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) return showToast?.('Your browser cannot share your location.');
    if (mine) return map.flyTo(mine.lat, mine.lng, 16.5);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update(pos);
        locateBtn.classList.add('on');
        map.flyTo(mine.lat, mine.lng, 16.5);
        watchId = navigator.geolocation.watchPosition(update, () => {}, { enableHighAccuracy: true });
      },
      (err) => showToast?.(err.code === 1 ? 'Location is blocked. Allow it for this site in your browser.' : 'Could not find your location.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });

  Promise.all([fetchLots(), fetchOutages(), fetchEvents(), fetchSmellPins(), fetchAreaAlerts()]).then(([lots, outages, events, smell, areaAlerts]) => {
    layers = buildLayers({ lots, outages, events, smell: smell.pins || [], areaAlerts: areaAlerts || [] });
    pushPins();
    draw();
    if (!applyTarget()) {
      map.overview();
    }
  });
  return () => {
    window.removeEventListener('hashchange', onHash);
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    map.destroy();
  };
}
