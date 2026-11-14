/* hop map engine. Runs inside the WebView (native) or iframe (web) and talks to the app through a tiny message bridge.
   App -> engine: setPins, flyTo, select, setTheme, setReducedMotion, setInsets, setUserLocation
   Engine -> app: ready, pinPress, longPress, tap, camera, error                                          */
(function () {
  var ART = window.__PIN_ART__ || {};
  var START = { center: [21.2272, 45.7537], zoom: 15.4 };
  var palette = 'vivid'; // flat-skin day palette: 'vivid' (default) | 'mono' | 'soft'
  var skin = 'flat'; // 'flat' (2D, default) or 'city3d'
  function skinPitch() { return skin === 'flat' ? 0 : 45; }
  function skinBearing() { return skin === 'flat' ? 0 : -15; }
  var BOUNDS = [[20.9, 45.55], [21.55, 45.95]];

  var map = null;
  var loaded = false;
  var queue = [];
  var themeSetting = 'auto';
  var activeTheme = null;
  var reduceMotion = false;
  var insets = { top: 0, right: 0, bottom: 0, left: 0 };
  var pins = {}; // id -> { data, marker, el }
  var selectedId = null;
  var userMarker = null;

  function send(msg) {
    try {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      else if (window.parent && window.parent !== window) window.parent.postMessage({ hubMap: true, msg: msg }, '*');
    } catch (e) { /* bridge not ready */ }
  }

  /* ---------- pins ---------- */
  function pinHtml(p) {
    var art = ART[p.art] || ART.note || '';
    var badge = p.badge === 'shared'
      ? '<span class="badge" title="Shared"><svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true"><circle cx="5.5" cy="6" r="2.4" fill="#1A1033"/><circle cx="11" cy="6.6" r="2" fill="#1A1033"/><path d="M1.5 13a4 4 0 0 1 8 0Z M8 13a3.2 3.2 0 0 1 6.4 0Z" fill="#1A1033"/></svg></span>'
      : p.badge === 'lock'
      ? '<span class="badge" title="Private"><svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="2" fill="#1A1033"/><path d="M5.2 7V5.4a2.8 2.8 0 0 1 5.6 0V7" fill="none" stroke="#1A1033" stroke-width="1.6"/></svg></span>'
      : '';
    return '<span class="tip"></span><span class="disc"><svg viewBox="0 0 56 56" width="28" height="28" aria-hidden="true">' + art + '</svg></span>' + badge + '<span class="foot"></span>';
  }

  function makeMarker(p) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'pin' + (p.id === selectedId ? ' selected' : '');
    el.setAttribute('aria-label', p.title + (p.kindLabel ? ', ' + p.kindLabel : ''));
    el.innerHTML = pinHtml(p);
    el.addEventListener('click', function (ev) { ev.stopPropagation(); send({ type: 'pinPress', id: p.id }); });
    var marker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(map);
    return { data: p, marker: marker, el: el };
  }

  function setPins(list) {
    var next = {};
    list.forEach(function (p) { next[p.id] = p; });
    Object.keys(pins).forEach(function (id) {
      if (!next[id]) { pins[id].marker.remove(); delete pins[id]; }
    });
    list.forEach(function (p) {
      var cur = pins[p.id];
      if (!cur) { pins[p.id] = makeMarker(p); return; }
      var changed = cur.data.title !== p.title || cur.data.art !== p.art || cur.data.badge !== p.badge || cur.data.kindLabel !== p.kindLabel;
      if (cur.data.lng !== p.lng || cur.data.lat !== p.lat) cur.marker.setLngLat([p.lng, p.lat]);
      if (changed) {
        cur.el.innerHTML = pinHtml(p);
        cur.el.setAttribute('aria-label', p.title + (p.kindLabel ? ', ' + p.kindLabel : ''));
      }
      cur.data = p;
    });
  }

  function select(id) {
    if (selectedId && pins[selectedId]) pins[selectedId].el.classList.remove('selected');
    selectedId = id || null;
    if (selectedId && pins[selectedId]) {
      pins[selectedId].el.classList.add('selected');
      pins[selectedId].marker.getElement().style.zIndex = 5;
    }
  }

  /* ---------- camera ---------- */
  function flyTo(c) {
    var opts = { center: [c.lng, c.lat], padding: insets };
    if (typeof c.zoom === 'number') opts.zoom = c.zoom;
    if (typeof c.pitch === 'number') opts.pitch = c.pitch;
    if (typeof c.bearing === 'number') opts.bearing = c.bearing;
    if (reduceMotion || c.instant) map.jumpTo(opts);
    else { opts.duration = 900; opts.essential = false; map.easeTo(opts); }
  }

  function setInsets(i) {
    insets = { top: i.top || 0, right: i.right || 0, bottom: i.bottom || 0, left: i.left || 0 };
    document.documentElement.style.setProperty('--hub-bottom', insets.bottom + 'px');
    if (map) map.setPadding(insets);
  }

  /* ---------- theme ---------- */
  function resolveTheme() { return themeSetting === 'auto' ? HubStyle.themeForNow(new Date()) : themeSetting; }
  function setSkin(next) {
    next = next === 'city3d' ? 'city3d' : 'flat';
    if (next === skin) return;
    skin = next;
    if (!map) return;
    map.setMaxPitch(skin === 'flat' ? 0 : 70);
    map.setStyle(HubStyle.buildStyle(activeTheme || resolveTheme(), skin, palette));
    map.easeTo({ pitch: skinPitch(), bearing: skinBearing(), duration: reduceMotion ? 0 : 600 });
  }
  function applyTheme(force) {
    var next = resolveTheme();
    if (!force && next === activeTheme) return;
    activeTheme = next;
    document.documentElement.setAttribute('data-theme', next);
    if (map) map.setStyle(HubStyle.buildStyle(next, skin, palette));
  }

  /* ---------- user location dot ---------- */
  function setUserLocation(p) {
    if (!p) { if (userMarker) { userMarker.remove(); userMarker = null; } return; }
    if (!userMarker) {
      var el = document.createElement('div');
      el.className = 'me';
      el.setAttribute('aria-label', 'Your location');
      userMarker = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
    } else userMarker.setLngLat([p.lng, p.lat]);
  }

  /* ---------- long press ---------- */
  var press = null;
  function startPress(e) {
    cancelPress();
    var pt = e.point;
    press = { x: pt.x, y: pt.y, ll: e.lngLat, t: setTimeout(function () {
      if (!press) return;
      send({ type: 'longPress', lat: press.ll.lat, lng: press.ll.lng });
      press = null;
    }, 550) };
  }
  function movePress(e) {
    if (!press) return;
    var dx = e.point.x - press.x, dy = e.point.y - press.y;
    if (dx * dx + dy * dy > 64) cancelPress();
  }
  function cancelPress() { if (press) { clearTimeout(press.t); press = null; } }

  /* ---------- offline / errors ---------- */
  var errorTimer = null;
  function showOffline(on) { var n = document.getElementById('offline'); if (n) n.hidden = !on; }

  /* ---------- commands ---------- */
  function handle(msg) {
    if (!msg || !msg.type) return;
    if (!loaded && msg.type !== 'setTheme' && msg.type !== 'setReducedMotion' && msg.type !== 'setInsets') { queue.push(msg); return; }
    switch (msg.type) {
      case 'setPins': setPins(msg.pins || []); break;
      case 'flyTo': flyTo(msg); break;
      case 'select': select(msg.id); break;
      case 'setTheme': themeSetting = msg.theme || 'auto'; if (map) applyTheme(false); break;
      case 'setReducedMotion': reduceMotion = !!msg.value; break;
      case 'setInsets': setInsets(msg); break;
      case 'setUserLocation': setUserLocation(msg.location); break;
      case 'retry': showOffline(false); if (map) map.setStyle(HubStyle.buildStyle(activeTheme || resolveTheme(), skin, palette)); break;
      case 'setSkin': setSkin(msg.skin); break;
      case 'setPalette': palette = msg.palette || 'soft'; if (map) map.setStyle(HubStyle.buildStyle(activeTheme || resolveTheme(), skin, palette)); break;
    }
  }

  window.__hubMap = { receive: function (json) { try { handle(typeof json === 'string' ? JSON.parse(json) : json); } catch (e) { send({ type: 'error', message: String(e) }); } } };
  window.addEventListener('message', function (ev) { var d = ev.data; if (d && d.hubMapCmd) window.__hubMap.receive(d.hubMapCmd); });
  document.addEventListener('message', function (ev) { window.__hubMap.receive(ev.data); }); // Android WebView

  /* ---------- boot ---------- */
  function boot() {
    if (!window.maplibregl) { document.getElementById('offline').hidden = false; send({ type: 'error', message: 'maplibre failed to load' }); return; }
    activeTheme = resolveTheme();
    document.documentElement.setAttribute('data-theme', activeTheme);
    map = new maplibregl.Map({
      container: 'map',
      style: HubStyle.buildStyle(activeTheme, skin, palette),
      center: START.center, zoom: START.zoom, pitch: skinPitch(), bearing: skinBearing(),
      maxPitch: skin === 'flat' ? 0 : 70, minZoom: 11.5, maxZoom: 19, maxBounds: BOUNDS,
      attributionControl: false,
      canvasContextAttributes: { antialias: true },
      dragRotate: true, touchPitch: true, pitchWithRotate: true
    });
    // facade textures are painted on demand: the style asks for 'hop-wall-<theme>-<n>'
    map.on('styleimagemissing', function (ev) {
      var m = /^hop-wall-(day|golden|night)-([0-9]+)$/.exec(ev.id);
      if (m && !map.hasImage(ev.id)) map.addImage(ev.id, HubStyle.wallImage(m[1], parseInt(m[2], 10)), { pixelRatio: 1.5 });
    });
    map.on('styleimagemissing', function (ev) {
      var g = /^hop-(ground|park)-(day|golden|night)$/.exec(ev.id);
      if (g && !map.hasImage(ev.id)) map.addImage(ev.id, HubStyle.groundImage(g[1], g[2]), { pixelRatio: 2 });
    });
    map.on('styleimagemissing', function (ev) {
      var rf = /^hop-roof-(day|golden|night)-([0-9]+)$/.exec(ev.id);
      if (rf && !map.hasImage(ev.id)) map.addImage(ev.id, HubStyle.roofImage(rf[1], parseInt(rf[2], 10)), { pixelRatio: 2 });
    });
    map.on('styleimagemissing', function (ev) {
      var p = /^hop-poi-(landmark|fountain|health|transit|dot)$/.exec(ev.id);
      if (p && !map.hasImage(ev.id)) map.addImage(ev.id, HubStyle.poiImage(p[1]), { pixelRatio: 2 });
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    map.touchZoomRotate.enableRotation();

    map.on('load', function () {
      loaded = true;
      send({ type: 'ready', theme: activeTheme });
      var q = queue; queue = [];
      q.forEach(handle);
    });
    map.on('click', function (e) { send({ type: 'tap', lat: e.lngLat.lat, lng: e.lngLat.lng }); });
    map.on('mousedown', startPress); map.on('touchstart', startPress);
    map.on('mousemove', movePress); map.on('touchmove', movePress);
    ['mouseup', 'touchend', 'touchcancel', 'movestart', 'zoomstart', 'dragstart'].forEach(function (n) { map.on(n, cancelPress); });
    var idle = null;
    map.on('moveend', function () {
      clearTimeout(idle);
      idle = setTimeout(function () {
        var c = map.getCenter();
        send({ type: 'camera', lat: c.lat, lng: c.lng, zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() });
      }, 250);
    });
    map.on('error', function (e) {
      var m = (e && e.error && e.error.message) || 'map error';
      if (/Failed to fetch|NetworkError|Load failed|Not allowed|403|404/i.test(m)) {
        clearTimeout(errorTimer);
        errorTimer = setTimeout(function () { showOffline(true); send({ type: 'error', message: m }); }, 1500);
      }
    });
    map.on('data', function (e) { if (e && e.dataType === 'source' && e.isSourceLoaded) { clearTimeout(errorTimer); showOffline(false); } });
    setInterval(function () { if (themeSetting === 'auto') applyTheme(false); }, 5 * 60 * 1000);
    document.getElementById('retry').addEventListener('click', function () { handle({ type: 'retry' }); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
