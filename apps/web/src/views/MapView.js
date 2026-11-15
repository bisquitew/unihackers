import { fetchEvents, fetchLots, fetchOutages, fetchSmellPins, fetchAreaAlerts, hubGet } from '../api.js';
import { art, esc, icons } from '../ui.js';
import { buildLayers, createMap, groupSimilarPins, makePin } from '../mapEngine.js';

export async function render() {
  return `<div class="map-page" id="mapPage">
    <aside class="map-panel" aria-label="Map layers">
      <h2>On the map</h2>
      <p class="muted" style="font-size:14px;margin-top:2px">Choose what to show, or pick a place.</p>
      <div class="map-search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="search" id="mapSearch" placeholder="Search places and addresses" aria-label="Search the map" autocomplete="off" maxlength="120">
      </div>
      <div class="scroll" id="searchResults" hidden aria-live="polite"></div>
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

  const map = createMap(page, { onPinPress: (id) => pick(id), onTap: () => close() });

  // the layers panel covers the left of the map on a wide screen and the bottom of it on a narrow one; the camera keeps the
  // picked pin in the middle of the part that is left
  const panel = page.querySelector('.map-panel');
  const applyInsets = () => {
    const wide = window.matchMedia('(min-width: 1081px)').matches;
    const box = panel?.getBoundingClientRect();
    const host = page.getBoundingClientRect();
    if (!box) return;
    map.setInsets(wide ? { left: Math.round(box.right - host.left) + 8 } : { bottom: Math.round(host.bottom - box.top) + 8 });
  };
  applyInsets();
  window.addEventListener('resize', applyInsets);

  // several people reporting the same issue close together show as one bigger pin with a count
  const visiblePins = () => groupSimilarPins(Object.entries(layers).filter(([k]) => !hidden[k]).flatMap(([, l]) => l.pins));
  // while a route is shown, the map is just you, the way and where you are going (plus the danger and works zones it steers round)
  const pushPins = () => map.setPins(trip ? visiblePins().filter((p) => (selected && p.id === selected.id) || p.radiusMeters) : visiblePins());

  // the card for the picked pin sits on the map, next to the panel, so it is seen the moment a pin is clicked
  const card = document.createElement('div');
  card.className = 'pin-card';
  card.hidden = true;
  page.appendChild(card);
  function showCard() {
    if (!selected) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    card.classList.toggle('routing', !!trip);
    if (trip) {
      card.innerHTML = `
        <button class="icon-btn pin-card-close" id="pinCardClose" aria-label="Close">×</button>
        <div class="head">${art(selected.art, 56)}<div><div class="muted">Directions to</div><h3>${esc(selected.title)}</h3></div></div>
        <div class="route-modes">${[['foot', 'Walk'], ['bike', 'Bike'], ['car', 'Car']].map(([m, l]) => `<button type="button" class="chip${trip.mode === m ? ' on' : ''}" data-mode="${m}" aria-pressed="${trip.mode === m}">${l}</button>`).join('')}</div>
        ${routeHtml()}`;
      card.querySelector('#pinCardClose').addEventListener('click', close);
      card.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => planTrip(b.dataset.mode)));
      card.querySelector('#tripRetry')?.addEventListener('click', () => planTrip(trip.mode));
      return;
    }
    card.innerHTML = `
      <button class="icon-btn pin-card-close" id="pinCardClose" aria-label="Close">×</button>
      <div class="head">${art(selected.art, 56)}<div><h3>${esc(selected.title)}</h3><div class="muted">${esc(selected.kindLabel)}</div></div></div>
      ${selected.desc ? `<p class="desc">${esc(selected.desc)}</p>` : ''}
      <div class="card-actions">
        ${canNavigateTo(selected) ? '<button type="button" class="btn btn-primary btn-md" id="dirBtn">Directions</button>' : ''}
        ${selected.link ? `<a class="btn btn-secondary btn-md" href="${esc(selected.link.href)}">${esc(selected.link.label)}</a>` : ''}
      </div>`;
    card.querySelector('#pinCardClose').addEventListener('click', close);
    card.querySelector('#dirBtn')?.addEventListener('click', () => planTrip('foot'));
  }
  function close() {
    endTrip();
    selected = null;
    map.select(null);
    showCard();
    draw();
  }

  // reports (smells), city alerts and zones are not places you go to
  const canNavigateTo = (p) => !p.radiusMeters && !p.count && p.art !== 'smell' && p.art !== 'utilities';

  // ---- directions: a route from where you are to the picked pin, checked against the danger and works zones by the server
  let trip = null;
  let tripAsk = 0;
  const minutes = (s) => { const m = Math.max(1, Math.round(s / 60)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`; };
  const metres = (m) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);
  const plainTitle = (t) => String(t || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
  function routeHtml() {
    if (trip.status === 'loading') return '<p class="muted route-line">Finding the way…</p>';
    if (trip.status === 'nolocation') return '<p>Turn on location to get directions from where you are.</p><button type="button" class="btn btn-primary btn-md" id="tripRetry">Turn on location</button>';
    if (trip.status === 'error') return `<p>${esc(trip.error || 'Could not get directions.')}</p><button type="button" class="btn btn-primary btn-md" id="tripRetry">Try again</button>`;
    const r = trip.result;
    const note = (cls, inner) => `<div class="route-note ${cls}">${inner}</div>`;
    const warnings = r.warnings.map((w) => note('warn', w.at_endpoint
      ? `<span>Your start or destination is inside ${esc(plainTitle(w.title))}</span>`
      : w.type === 'danger'
        ? `<span>Passes through ${esc(plainTitle(w.title))}, about ${metres(w.meters_inside)}</span>`
        : `<span>Passes by works: ${esc(plainTitle(w.title))}, about ${metres(w.meters_inside)}</span>`)).join('');
    const avoided = r.avoided.map((a) => note('ok', `<span>Goes around ${esc(plainTitle(a.title))}</span>`)).join('');
    const stuck = r.could_not_avoid ? note('warn', '<span>There is no way round the danger zone. Take care.</span>') : '';
    const help = r.help_nearby.length
      ? `<div class="muted" style="font-size:13px;margin-top:12px">Help close to the way</div>${r.help_nearby.map((h) => note('ok', `<span>${esc(h.label)}</span>: <b>${esc(h.name)}</b> · <span>${metres(h.meters_from_route)} from the route</span>`)).join('')}`
      : '';
    const steps = r.steps.map((s) => `<li><span>${esc(s.instruction)}</span>${s.distance_m > 0 ? `<span class="muted">${metres(s.distance_m)}</span>` : ''}</li>`).join('');
    return `<div class="route-sum"><strong>${minutes(r.duration_s)}</strong><span class="muted">${metres(r.distance_m)}</span></div>
      ${avoided}${warnings}${stuck}${help}
      <details class="route-steps"><summary>Show steps</summary><ol>${steps}</ol></details>`;
  }
  function endTrip() {
    tripAsk += 1;
    trip = null;
    map.setRoute(null);
    pushPins();
  }
  function getOrigin() {
    if (mine) return Promise.resolve(mine);
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition((pos) => { update(pos); locateBtn?.classList.add('on'); resolve(mine); }, () => resolve(null), { enableHighAccuracy: true, timeout: 15000 });
    });
  }
  async function planTrip(mode) {
    if (!selected) return;
    const ask = ++tripAsk;
    const to = selected;
    trip = { mode, status: 'loading' };
    pushPins();
    showCard();
    const from = await getOrigin();
    if (ask !== tripAsk) return;
    if (!from) { trip = { mode, status: 'nolocation' }; showCard(); return; }
    try {
      const result = await hubGet(`/v1/core/route?from=${from.lat.toFixed(6)},${from.lng.toFixed(6)}&to=${to.lat.toFixed(6)},${to.lng.toFixed(6)}&mode=${mode}`);
      if (ask !== tripAsk) return;
      trip = { mode, status: 'ready', result };
      map.setRoute([[from.lng, from.lat], ...result.geometry]); // with you at the start, so the map shows you and the whole way
    } catch (e) {
      if (ask !== tripAsk) return;
      trip = { mode, status: 'error', error: e && e.message && e.message.length < 140 ? e.message : '' };
    }
    showCard();
  }

  function pick(id) {
    if (trip) endTrip();
    selected = visiblePins().find((p) => p.id === id) || null;
    map.select(selected ? selected.id : null);
    if (selected) {
      // a danger or works zone is framed whole; a single place is zoomed in on
      const radius = selected.radiusMeters || 0;
      const zoom = radius >= 1000 ? 13.8 : radius >= 600 ? 14.4 : radius >= 300 ? 15.2 : 16;
      map.flyTo(selected.lat, selected.lng, zoom);
    }
    showCard();
    draw();
  }

  function draw() {
    const layerRows = Object.entries(layers).filter(([key]) => key !== 'search').map(([key, l]) => `
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
      ${selected ? `<div class="pin-detail"><div class="head">${art(selected.art, 52)}<div><h3>${esc(selected.title)}</h3><div class="muted">${esc(selected.kindLabel)}</div>${selected.radiusMeters ? `<div class="zone-line ${selected.zoneType === 'danger' ? 'danger' : 'works'}">${selected.zoneType === 'danger' ? 'Keep away from the area' : 'Works in progress'} · ${selected.radiusMeters} m around</div>` : ''}</div></div></div>` : ''}
      <h3 style="font-size:17px;margin:18px 0 4px">Places</h3><div class="list">${places || '<div class="empty">Nothing shown.</div>'}</div>`;
    scroll.querySelectorAll('[data-layer]').forEach((el) => el.addEventListener('change', () => {
      hidden[el.dataset.layer] = !el.checked;
      if (selected && !visiblePins().some((p) => p.id === selected.id)) { selected = null; showCard(); }
      pushPins();
      draw();
    }));
    scroll.querySelectorAll('[data-pin]').forEach((el) => el.addEventListener('click', () => pick(el.dataset.pin)));
  }

  // ---- search: what is already on the map is matched here as you type; streets, addresses and places come from the server
  const searchInput = document.getElementById('mapSearch');
  const resultsBox = document.getElementById('searchResults');
  const plain = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let searchTimer = null;
  let searchToken = 0;
  const endSearch = () => {
    searchInput.value = '';
    resultsBox.hidden = true;
    scroll.hidden = false;
  };
  const drawResults = (onMap, places, state) => {
    const rowOf = (attrs, artHtml, title, detail) => `<button class="row" ${attrs} style="padding:12px 4px"><div class="art" style="width:40px;height:40px">${artHtml}</div><div class="body"><div class="title">${esc(title)}</div>${detail ? `<div class="detail">${esc(detail)}</div>` : ''}</div></button>`;
    resultsBox.innerHTML = `
      ${onMap.length ? '<h3 style="font-size:15px;margin:14px 0 2px">On the map</h3>' : ''}
      <div class="list">${onMap.map((p) => rowOf(`data-spin="${esc(p.id)}"`, art(p.art, 40), p.title, p.kindLabel)).join('')}</div>
      ${places.length ? '<h3 style="font-size:15px;margin:14px 0 2px">Places and addresses</h3>' : ''}
      <div class="list">${places.map((p, i) => rowOf(`data-splace="${i}"`, art('note', 40), p.name, p.detail)).join('')}</div>
      ${state === 'searching' ? '<p class="muted" style="margin-top:12px">Searching…</p>' : ''}
      ${state === 'none' ? '<p class="muted" style="margin-top:12px">No matches. Try a street, a place or an address.</p>' : ''}`;
    resultsBox.querySelectorAll('[data-spin]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.spin;
      endSearch();
      const key = Object.keys(layers).find((k) => layers[k].pins.some((p) => p.id === id));
      if (key) { hidden[key] = false; pushPins(); }
      pick(id);
    }));
    resultsBox.querySelectorAll('[data-splace]').forEach((b) => b.addEventListener('click', () => {
      const place = places[Number(b.dataset.splace)];
      endSearch();
      layers.search = { title: 'Search result', art: 'note', pins: [makePin('search-result', [place.latitude, place.longitude], 'note', place.name, 'Place', { desc: place.detail || '' })] };
      hidden.search = false;
      pushPins();
      pick('search-result');
    }));
  };
  searchInput.addEventListener('input', () => {
    const text = searchInput.value.trim();
    clearTimeout(searchTimer);
    searchToken += 1;
    if (text.length < 2) { resultsBox.hidden = true; scroll.hidden = false; return; }
    scroll.hidden = true;
    resultsBox.hidden = false;
    const needle = plain(text);
    const onMap = Object.entries(layers).filter(([k]) => k !== 'search').flatMap(([, l]) => l.pins).filter((p) => plain(`${p.title} ${p.kindLabel}`).includes(needle)).slice(0, 4);
    if (text.length < 3) { drawResults(onMap, [], 'none'); return; }
    drawResults(onMap, [], 'searching');
    const mine = searchToken;
    searchTimer = setTimeout(async () => {
      let places = [];
      try { places = (await hubGet(`/v1/core/places/search?q=${encodeURIComponent(text)}`)).places || []; } catch { /* shown as no matches */ }
      if (mine === searchToken) drawResults(onMap, places, places.length || onMap.length ? 'done' : 'none');
    }, 450);
  });
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { endSearch(); searchInput.blur(); } });

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

  Promise.all([fetchLots(), fetchOutages(), fetchEvents(), fetchSmellPins(), fetchAreaAlerts(), hubGet('/v1/m/safety/places').catch(() => ({ places: [] }))]).then(([lots, outages, events, smell, areaAlerts, safe]) => {
    layers = buildLayers({ lots, outages, events, smell: smell.pins || [], areaAlerts: areaAlerts || [], safePlaces: safe.places || [] });
    pushPins();
    draw();
    if (!applyTarget()) {
      map.overview();
    }
  });
  return () => {
    window.removeEventListener('resize', applyInsets);
    window.removeEventListener('hashchange', onHash);
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    map.destroy();
  };
}
