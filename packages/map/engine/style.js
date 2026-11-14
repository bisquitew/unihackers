/* hop city style for MapLibre GL JS, over OpenFreeMap (OpenMapTiles schema).
   The map is a quiet stage in the brand's look (docs/brand/identity.md): near-white ground, white buildings with soft
   ink shading, mint and blue only for parks and water. The colour comes from the pins and illustrations on top of it.
   Runs inside the map WebView/iframe. Exposes window.HubStyle = { buildStyle, themeForNow, sunAltitude }. */
(function () {
  var THEMES = {
    day: {
      bg: '#F1EDF9', park: '#C2EFDD', wood: '#B3EAD2', water: '#C4D4FF', waterLine: '#8FA3FF',
      road: '#FFFFFF', roadCasing: 'rgba(26,16,51,0.15)', rail: 'rgba(36,56,201,0.45)', glow: null,
      bldLow: '#FFFFFF', bldHigh: '#D5CCEA', bldFlat: '#FBFAFE',
      label: '#1A1033', labelMuted: '#5A5070', halo: '#FFFFFF',
      sky: '#E3DDF2', horizon: '#F6F3FB', fog: '#EFEBF8',
      light: { color: '#FFFFFF', intensity: 0.3, position: [1.5, 200, 45] }
    },
    golden: {
      bg: '#F6EFE8', park: '#D6EDD8', wood: '#C6E5CB', water: '#CFD6F5', waterLine: '#A3B0EE',
      road: '#FFFDFA', roadCasing: 'rgba(58,47,92,0.12)', rail: 'rgba(36,56,201,0.40)', glow: null,
      bldLow: '#FFFFFF', bldHigh: '#EBD9CD', bldFlat: '#FFFDFA',
      label: '#3A2F5C', labelMuted: '#6B5C7A', halo: '#FFF9F2',
      sky: '#FFD9BC', horizon: '#FFEBDC', fog: '#FBEFE4',
      light: { color: '#FFD9B0', intensity: 0.3, position: [1.5, 235, 50] }
    },
    night: {
      bg: '#14091F', park: '#1A2733', wood: '#16222E', water: '#1D2466', waterLine: '#3D5BFF',
      road: '#FFD9A8', roadCasing: 'rgba(255,217,168,0.0)', rail: 'rgba(108,132,255,0.65)', glow: '#FFB866',
      bldLow: '#2A1B49', bldHigh: '#3E2D68', bldFlat: '#241540',
      label: '#F8F6FB', labelMuted: '#B9A8DD', halo: '#14091F',
      sky: '#0B0618', horizon: '#2A1B49', fog: '#1B1030',
      light: { color: '#B9A8FF', intensity: 0.25, position: [1.5, 210, 38] }
    }
  };

  var BLD_H = ['max', ['coalesce', ['get', 'render_height'], 6], 5];
  var BLD_BASE = ['coalesce', ['get', 'render_min_height'], 0];
  /* Every building gets one of five soft tints from the identity palette (cream, lilac, periwinkle, mint, apricot),
     picked from its own height/id so neighbours differ but a building never changes. The ground floor is a deeper band
     of the same tint, which gives each block a base and a little architecture without textures (textures shimmer). */
  var TINTS = {
    day:    { wall: ['#F2DCC2', '#D6C8F4', '#C3D1FB', '#FFCFAF', '#E2DCEC'], plinth: ['#DDC19F', '#BFAEE8', '#A9BDF2', '#F2B58F', '#CBC2DA'], roof: ['#EDBBA2', '#CFC6E8', '#EBD6B8', '#BFCDF4', '#E3BFB4'] },
    golden: { wall: ['#F5D9BC', '#E3CBE3', '#D5CEF0', '#FFC9A3', '#E8DACB'], plinth: ['#E2BE98', '#CCAECC', '#BBB2E0', '#F2AE86', '#D3C0AD'], roof: ['#E9B08F', '#C9BADF', '#E8CFA8', '#B5BFEA', '#DDB1A0'] },
    night:  { wall: ['#3A2A63', '#33295A', '#2C2F66', '#2A3A5E', '#40285E'], plinth: ['#2A1B49', '#241A44', '#1F2250', '#1D2B49', '#301C4A'], roof: ['#5B4A8C', '#4E4380', '#444C8E', '#42557F', '#614384'] }
  };
  var N_TINTS = 5;
  var VARIANT = ['%', ['abs', ['floor', ['+', ['*', ['coalesce', ['get', 'render_height'], 6], 3.7], ['*', BLD_BASE, 1.9], ['to-number', ['id'], 0]]]], N_TINTS];
  function tintMatch(list) { return ['match', VARIANT, 0, list[0], 1, list[1], 2, list[2], 3, list[3], list[4]]; }
  var PLINTH_H = ['min', 3.5, ['*', BLD_H, 0.4]];

  /* Facade texture, painted on a canvas (no image files). Modern ribbon windows: soft glass with a sky reflection,
     a thin slab line between floors. Low contrast on purpose: high-contrast textures shimmer when they shrink.
     Night: some windows are lit warm. One tile = 2 bays x 2 floors. */
  var GLASS = {
    day:    { top: '#C8D6FF', bottom: '#9DB0F0', lit: 0, litTop: '#C8D6FF', litBottom: '#9DB0F0' },
    golden: { top: '#FFDDBE', bottom: '#F2A877', lit: 0.1, litTop: '#FFE3B8', litBottom: '#FFB866' },
    night:  { top: '#241C4A', bottom: '#181238', lit: 0.5, litTop: '#FFE2B5', litBottom: '#FFB866' }
  };
  /* Ground and park textures: a fine dotted-paper grid and a leafy speckle, painted on a canvas, transparent so the
     flat colour shows through. They fade in with zoom (see fade()) because world-fixed patterns shimmer when small. */
  var DOT = {
    day:    { ground: 'rgba(26,16,51,0.17)', park: 'rgba(0,112,79,0.30)' },
    golden: { ground: 'rgba(58,47,92,0.16)', park: 'rgba(0,112,79,0.28)' },
    night:  { ground: 'rgba(255,255,255,0.09)', park: 'rgba(126,230,200,0.24)' }
  };
  function groundImage(kind, theme) {
    var d = DOT[theme] || DOT.day, S = kind === 'park' ? 32 : 24;
    var c = document.createElement('canvas'); c.width = S; c.height = S;
    var g = c.getContext('2d');
    g.fillStyle = kind === 'park' ? d.park : d.ground;
    var dots = kind === 'park' ? [[6, 7, 1.7], [21, 5, 1.2], [14, 18, 1.9], [27, 24, 1.3], [5, 27, 1.2]] : [[S / 2, S / 2, 1.6]];
    for (var i = 0; i < dots.length; i++) { g.beginPath(); g.arc(dots[i][0], dots[i][1], dots[i][2], 0, Math.PI * 2); g.fill(); }
    var im = g.getImageData(0, 0, S, S);
    return { width: S, height: S, data: new Uint8Array(im.data.buffer) };
  }
  /* Roof texture: courses of tiles. Painted on a canvas, like the facades. */
  function roofImage(theme, idx) {
    var t = TINTS[theme] || TINTS.day, S = 32;
    var c = document.createElement('canvas'); c.width = S; c.height = S;
    var g = c.getContext('2d');
    g.fillStyle = t.roof[idx % t.roof.length]; g.fillRect(0, 0, S, S);
    for (var row = 0; row < 4; row++) {
      var y = row * 8;
      g.fillStyle = 'rgba(26,16,51,0.13)'; g.fillRect(0, y, S, 1.5);       // shadow under each course
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(0, y + 1.5, S, 1.5); // light on the tile edge
      var off = row % 2 ? 8 : 0;                                            // staggered seams
      g.fillStyle = 'rgba(26,16,51,0.07)';
      for (var x = off; x < S; x += 16) g.fillRect(x, y + 3, 1, 5);
    }
    var im = g.getImageData(0, 0, S, S);
    return { width: S, height: S, data: new Uint8Array(im.data.buffer) };
  }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function wallImage(theme, idx) {
    var t = TINTS[theme] || TINTS.day, gl = GLASS[theme] || GLASS.day, S = 48, F = 24;
    var c = document.createElement('canvas'); c.width = S; c.height = S;
    var g = c.getContext('2d');
    g.fillStyle = t.wall[idx % t.wall.length]; g.fillRect(0, 0, S, S);
    for (var row = 0; row < 2; row++) {
      var y0 = row * F;
      g.fillStyle = 'rgba(26,16,51,0.07)'; g.fillRect(0, y0 + F - 2, S, 2); // slab line
      for (var col = 0; col < 2; col++) {
        var lit = hash(idx * 17 + col * 5 + row * 3 + theme.length) < gl.lit;
        var x = col * 24 + 4, y = y0 + 5;
        var grad = g.createLinearGradient(0, y, 0, y + 14);
        grad.addColorStop(0, lit ? gl.litTop : gl.top); grad.addColorStop(1, lit ? gl.litBottom : gl.bottom);
        g.fillStyle = grad; roundRect(g, x, y, 16, 14, 3); g.fill();
        if (!lit) { // sky reflection
          g.save(); roundRect(g, x, y, 16, 14, 3); g.clip();
          g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 9, y); g.lineTo(x, y + 9); g.closePath(); g.fill();
          g.restore();
        }
      }
    }
    var d = g.getImageData(0, 0, S, S);
    return { width: S, height: S, data: new Uint8Array(d.data.buffer) };
  }
  // buildings fade in/out with zoom instead of changing height, so nothing pops
  function fade(a, b) { return ['interpolate', ['linear'], ['zoom'], a, 0, b, 1]; }

  var ROAD_CLASSES =['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service'];
  var NAME = ['coalesce', ['get', 'name:latin'], ['get', 'name']];

  function roadWidth(base) {
    var w = function (m, p, s, t, mi, sv) {
      return ['match', ['get', 'class'], ['motorway', 'trunk'], m, 'primary', p, 'secondary', s, 'tertiary', t, 'minor', mi, sv];
    };
    return ['interpolate', ['exponential', 1.5], ['zoom'],
      12, w(base * 1.6, base * 1.3, base * 1.0, base * 0.8, base * 0.5, base * 0.3),
      18, w(base * 12, base * 10, base * 8, base * 6.5, base * 5, base * 3)];
  }

  /* ---------- flat 2D skin ----------
     The recipe borrowed from bright "no label" maps (flat, saturated, almost no text, vivid water), in hop's colours:
     near-white lilac ground, the illustration palette's richer tones for water, parks and buildings, a soft offset
     shadow under each building for depth, and only the city and district names as labels. */
  var FLAT = {
    day: {
      bg: '#F7F3FD', city: '#F2E6F2', park: '#A8EFD6', wood: '#93E8CB', water: '#9DB8FF', waterLine: '#6C84FF',
      road: '#FFFFFF', casing: 'rgba(26,16,51,0.22)', rail: 'rgba(36,56,201,0.5)', shadow: 'rgba(26,16,51,0.13)', edge: 'rgba(26,16,51,0.10)',
      blds: ['#FFCFA8', '#D3C5F8', '#B9CBFF', '#F4DDB6', '#FFBBA3'],
      label: '#1A1033', labelMuted: '#5A5070', halo: '#FFFFFF'
    },
    golden: {
      bg: '#FBF1E8', city: '#F8DEC6', park: '#BDEBC8', wood: '#A9E2B7', water: '#AFC0F5', waterLine: '#8294EE',
      road: '#FFFDFA', casing: 'rgba(58,47,92,0.14)', rail: 'rgba(36,56,201,0.45)', shadow: 'rgba(58,47,92,0.14)', edge: 'rgba(58,47,92,0.10)',
      blds: ['#FFAA73', '#8FA0F5', '#BFA2F0', '#FFC7A0', '#A3B0F2'],
      label: '#3A2F5C', labelMuted: '#6B5C7A', halo: '#FFF9F2'
    },
    night: {
      bg: '#14091F', city: '#2A1850', park: '#14343B', wood: '#112C34', water: '#1B2A82', waterLine: '#3D5BFF',
      road: '#4A3A7C', casing: 'rgba(0,0,0,0.0)', rail: 'rgba(108,132,255,0.7)', shadow: 'rgba(0,0,0,0.35)', edge: 'rgba(255,255,255,0.06)',
      blds: ['#5A3FA0', '#3347C4', '#6B3FB0', '#2E63A8', '#7C46A0'],
      label: '#F8F6FB', labelMuted: '#B9A8DD', halo: '#14091F'
    }
  };
  /* Alternative day palettes for the flat skin, to compare side by side (engine message setPalette).
     soft: the original pastel buildings. mono: calm neutral lilac buildings, colour only in parks and water.
     vivid: the illustration palette's richer tones on the buildings. */
  var FLAT_ALT = {
    mono: {
      bg: '#F6F3FB', city: '#E9E3F6', park: '#98EBCE', wood: '#82E5C3', water: '#86A8FF', waterLine: '#6C84FF',
      road: '#FFFFFF', casing: 'rgba(26,16,51,0.22)', rail: 'rgba(36,56,201,0.55)', shadow: 'rgba(26,16,51,0.14)', edge: 'rgba(26,16,51,0.10)',
      blds: ['#E6E0F3', '#DAD2EC', '#EEEAF8', '#E0D9F0', '#D3CAE7'],
      label: '#1A1033', labelMuted: '#5A5070', halo: '#FFFFFF'
    },
    vivid: {
      bg: '#FFFBF5', city: '#FFE6CF', park: '#8BE9CD', wood: '#74E2C2', water: '#7C96FF', waterLine: '#3D5BFF',
      road: '#FFFFFF', casing: 'rgba(26,16,51,0.22)', rail: 'rgba(36,56,201,0.55)', shadow: 'rgba(26,16,51,0.16)', edge: 'rgba(26,16,51,0.10)',
      blds: ['#FFB88A', '#8FA3FF', '#C3A8FF', '#FFD0B0', '#A9B8FF'],
      label: '#1A1033', labelMuted: '#5A5070', halo: '#FFFFFF'
    }
  };
  function buildFlat(themeName, palette) {
    var f = (themeName === 'day' && FLAT_ALT[palette || 'vivid']) || FLAT[themeName] || FLAT.day;
    var variantColor = ['match', VARIANT, 0, f.blds[0], 1, f.blds[1], 2, f.blds[2], 3, f.blds[3], f.blds[4]];
    var roadFilter = ['all', ['in', ['get', 'class'], ['literal', ROAD_CLASSES]], ['any', ['!=', ['get', 'class'], 'service'], ['>=', ['zoom'], 17]]];
    var cap = { 'line-cap': 'round', 'line-join': 'round' };
    var layers = [
      { id: 'background', type: 'background', paint: { 'background-color': f.bg } },
      // built-up areas: carries the shape of the city while zoomed out, fades out as the buildings take over
      { id: 'landuse-city', type: 'fill', source: 'ofm', 'source-layer': 'landuse',
        filter: ['in', ['get', 'class'], ['literal', ['residential', 'suburb', 'commercial', 'retail', 'industrial', 'neighbourhood']]],
        paint: { 'fill-color': f.city, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 11, 1, 14, 1, 16, 0] } },
      { id: 'landcover', type: 'fill', source: 'ofm', 'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'forest']]], paint: { 'fill-color': f.wood, 'fill-opacity': 0.85 } },
      { id: 'park', type: 'fill', source: 'ofm', 'source-layer': 'park', paint: { 'fill-color': f.park } },
      { id: 'water', type: 'fill', source: 'ofm', 'source-layer': 'water', paint: { 'fill-color': f.water } },
      { id: 'waterway', type: 'line', source: 'ofm', 'source-layer': 'waterway',
        paint: { 'line-color': f.water, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 18, 10] } },
      { id: 'road-casing', type: 'line', source: 'ofm', 'source-layer': 'transportation', filter: roadFilter, layout: cap,
        paint: { 'line-color': f.casing, 'line-width': roadWidth(2.3) } },
      { id: 'road', type: 'line', source: 'ofm', 'source-layer': 'transportation', filter: roadFilter, layout: cap,
        paint: { 'line-color': f.road, 'line-width': roadWidth(1.8) } },
      { id: 'rail', type: 'line', source: 'ofm', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'rail'], minzoom: 12,
        paint: { 'line-color': f.rail, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 18, 3.5], 'line-dasharray': [2, 2] } },
      // soft offset shadow, then the flat building shapes in five palette tones, then a hairline edge
      { id: 'building-shadow', type: 'fill', source: 'ofm', 'source-layer': 'building', minzoom: 14.5,
        paint: { 'fill-color': f.shadow, 'fill-translate': [2.5, 4], 'fill-translate-anchor': 'viewport', 'fill-opacity': fade(14.5, 16) } },
      { id: 'building', type: 'fill', source: 'ofm', 'source-layer': 'building', paint: { 'fill-color': variantColor } },
      { id: 'building-edge', type: 'line', source: 'ofm', 'source-layer': 'building', minzoom: 17.2,
        paint: { 'line-color': f.edge, 'line-width': 0.8 } },
      // text is kept to a minimum: the city, and district names while zoomed out
      { id: 'place-suburb', type: 'symbol', source: 'ofm', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood']]], minzoom: 12.5, maxzoom: 16,
        layout: { 'text-field': NAME, 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-max-width': 7 },
        paint: { 'text-color': f.labelMuted, 'text-halo-color': f.halo, 'text-halo-width': 1.6 } },
      { id: 'place-city', type: 'symbol', source: 'ofm', 'source-layer': 'place', filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: { 'text-field': NAME, 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 8, 13, 14, 20], 'text-max-width': 8 },
        paint: { 'text-color': f.label, 'text-halo-color': f.halo, 'text-halo-width': 2 } }
    ];
    return {
      version: 8, name: 'hop-flat-' + themeName,
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sources: { ofm: { type: 'vector', url: 'https://tiles.openfreemap.org/planet',
        attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' } },
      layers: layers
    };
  }

  function buildStyle(themeName, skin, palette) {
    if (skin === 'flat') return buildFlat(THEMES[themeName] ? themeName : 'day', palette);
    themeName = THEMES[themeName] ? themeName : 'day';
    var t = THEMES[themeName];
    // service lanes and alleys are noise at city scale; they only appear up close
    var roadFilter = ['all',
      ['in', ['get', 'class'], ['literal', ROAD_CLASSES]],
      ['any', ['!=', ['get', 'class'], 'service'], ['>=', ['zoom'], 17]]];
    var layers = [
      { id: 'background', type: 'background', paint: { 'background-color': t.bg } },
      { id: 'ground-dots', type: 'background', paint: { 'background-pattern': 'hop-ground-' + themeName, 'background-opacity': fade(14.2, 16) } },
      { id: 'landcover', type: 'fill', source: 'ofm', 'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'forest']]],
        paint: { 'fill-color': t.wood, 'fill-opacity': 0.75 } },
      { id: 'park', type: 'fill', source: 'ofm', 'source-layer': 'park',
        paint: { 'fill-color': t.park, 'fill-opacity': 0.9 } },
      { id: 'park-speckle', type: 'fill', source: 'ofm', 'source-layer': 'park', minzoom: 14,
        paint: { 'fill-pattern': 'hop-park-' + themeName, 'fill-opacity': fade(14.2, 16) } },
      { id: 'park-edge', type: 'line', source: 'ofm', 'source-layer': 'park', layout: { 'line-join': 'round' },
        paint: { 'line-color': t.wood, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 4], 'line-opacity': 0.9 } },
      { id: 'water', type: 'fill', source: 'ofm', 'source-layer': 'water',
        paint: { 'fill-color': t.water } },
      { id: 'water-edge', type: 'line', source: 'ofm', 'source-layer': 'water', layout: { 'line-join': 'round' },
        paint: { 'line-color': t.waterLine, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 17, 3.5], 'line-opacity': 0.7 } },
      { id: 'waterway', type: 'line', source: 'ofm', 'source-layer': 'waterway',
        paint: { 'line-color': t.waterLine, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 18, 8], 'line-opacity': 0.9 } }
    ];

    if (t.glow) {
      layers.push({ id: 'road-glow', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: roadFilter, layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': t.glow, 'line-width': roadWidth(2.4), 'line-blur': 6, 'line-opacity': 0.28 } });
    }

    layers.push(
      { id: 'road-casing', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: roadFilter, layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': t.roadCasing, 'line-width': roadWidth(2.2) } },
      { id: 'road', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: roadFilter, layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': t.road, 'line-width': roadWidth(1.7), 'line-opacity': t.glow ? 0.85 : 1 } },
      { id: 'rail', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: ['==', ['get', 'class'], 'rail'], minzoom: 12,
        paint: { 'line-color': t.rail, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.8, 18, 3], 'line-dasharray': [2, 2] } },
      { id: 'building-flat', type: 'fill', source: 'ofm', 'source-layer': 'building',
        paint: { 'fill-color': t.bldFlat, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 11.5, 0.6, 13.5, 1] } },
      // soft contact shadow where buildings meet the street
      { id: 'building-shadow', type: 'line', source: 'ofm', 'source-layer': 'building', minzoom: 15,
        paint: { 'line-color': themeName === 'night' ? '#0B0720' : '#1A1033', 'line-opacity': themeName === 'night' ? 0.5 : 0.12, 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 2, 18, 8], 'line-blur': ['interpolate', ['linear'], ['zoom'], 15, 2, 18, 6] } },
      // the building above its ground floor
      { id: 'building-3d', type: 'fill-extrusion', source: 'ofm', 'source-layer': 'building', minzoom: 13, maxzoom: 15,
        filter: ['>=', ['coalesce', ['get', 'render_height'], 6], 5],
        paint: {
          'fill-extrusion-color': tintMatch(TINTS[themeName].wall),
          'fill-extrusion-height': BLD_H,
          'fill-extrusion-base': ['max', BLD_BASE, PLINTH_H],
          'fill-extrusion-opacity': fade(13, 14.6),
          'fill-extrusion-vertical-gradient': true
        } },
      // the ground-floor band, a deeper shade of the same tint
      { id: 'building-plinth', type: 'fill-extrusion', source: 'ofm', 'source-layer': 'building', minzoom: 13,
        filter: ['all', ['>=', ['coalesce', ['get', 'render_height'], 6], 5], ['==', BLD_BASE, 0]],
        paint: {
          'fill-extrusion-color': tintMatch(TINTS[themeName].plinth),
          'fill-extrusion-height': PLINTH_H,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': fade(13, 14.6),
          'fill-extrusion-vertical-gradient': true
        } }
    );
    // close view: facade textures (one layer per tint, a pattern per layer is the most reliable across MapLibre versions)
    for (var v = 0; v < N_TINTS; v++) {
      layers.push({ id: 'building-facade-' + v, type: 'fill-extrusion', source: 'ofm', 'source-layer': 'building', minzoom: 15,
        filter: ['all', ['>=', ['coalesce', ['get', 'render_height'], 6], 5], ['==', VARIANT, v]],
        paint: {
          'fill-extrusion-pattern': 'hop-wall-' + themeName + '-' + v,
          'fill-extrusion-height': BLD_H,
          'fill-extrusion-base': ['max', BLD_BASE, PLINTH_H],
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': true
        } });
    }
    // roofs: a solid cap while far away, a tile texture up close (so the facade pattern never climbs onto the roof)
    layers.push({ id: 'building-roof', type: 'fill-extrusion', source: 'ofm', 'source-layer': 'building', minzoom: 15, maxzoom: 16,
      filter: ['>=', ['coalesce', ['get', 'render_height'], 6], 5],
      paint: {
        'fill-extrusion-color': tintMatch(TINTS[themeName].roof),
        'fill-extrusion-height': ['+', BLD_H, 0.6],
        'fill-extrusion-base': BLD_H,
        'fill-extrusion-opacity': 1,
        'fill-extrusion-vertical-gradient': false
      } });
    for (var r = 0; r < N_TINTS; r++) {
      layers.push({ id: 'building-roof-tiles-' + r, type: 'fill-extrusion', source: 'ofm', 'source-layer': 'building', minzoom: 16,
        filter: ['all', ['>=', ['coalesce', ['get', 'render_height'], 6], 5], ['==', VARIANT, r]],
        paint: {
          'fill-extrusion-pattern': 'hop-roof-' + themeName + '-' + r,
          'fill-extrusion-height': ['+', BLD_H, 0.6],
          'fill-extrusion-base': BLD_H,
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': false
        } });
    }
    layers.push();
    layers.push(
      { id: 'water-name', type: 'symbol', source: 'ofm', 'source-layer': 'water_name', minzoom: 13,
        layout: { 'text-field': NAME, 'text-font': ['Noto Sans Italic'], 'text-size': 12, 'text-letter-spacing': 0.1 },
        paint: { 'text-color': t.waterLine, 'text-halo-color': t.halo, 'text-halo-width': 1 } },
      // street names only for the main streets, and only when close: the map should be calm, not a directory
      { id: 'road-name', type: 'symbol', source: 'ofm', 'source-layer': 'transportation_name', minzoom: 16.6,
        filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]],
        layout: { 'text-field': NAME, 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'symbol-placement': 'line', 'text-rotation-alignment': 'map', 'text-pitch-alignment': 'viewport' },
        paint: { 'text-color': t.labelMuted, 'text-halo-color': t.halo, 'text-halo-width': 1.4 } },
      { id: 'place-suburb', type: 'symbol', source: 'ofm', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood']]], minzoom: 12.5, maxzoom: 16,
        layout: { 'text-field': NAME, 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-transform': 'none', 'text-letter-spacing': 0.04, 'text-max-width': 7 },
        paint: { 'text-color': t.labelMuted, 'text-halo-color': t.halo, 'text-halo-width': 1.6 } },
      { id: 'place-city', type: 'symbol', source: 'ofm', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: { 'text-field': NAME, 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 8, 13, 14, 20], 'text-max-width': 8 },
        paint: { 'text-color': t.label, 'text-halo-color': t.halo, 'text-halo-width': 2 } }
    );

    return {
      version: 8,
      name: 'hop-' + themeName,
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sources: {
        ofm: {
          type: 'vector',
          url: 'https://tiles.openfreemap.org/planet',
          attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }
      },
      sky: {
        'sky-color': t.sky, 'horizon-color': t.horizon, 'fog-color': t.fog,
        'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.55
      },
      light: { anchor: 'map', color: t.light.color, intensity: t.light.intensity, position: t.light.position },
      layers: layers
    };
  }

  /* Solar altitude (degrees) for Timisoara. Used for the automatic day / golden hour / night theme. */
  function sunAltitude(date) {
    var rad = Math.PI / 180, lat = 45.7489, lon = 21.2087;
    var d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
    var g = (357.529 + 0.98560028 * d) % 360;
    var q = (280.459 + 0.98564736 * d) % 360;
    var L = q + 1.915 * Math.sin(g * rad) + 0.020 * Math.sin(2 * g * rad);
    var e = 23.439 - 0.00000036 * d;
    var ra = Math.atan2(Math.cos(e * rad) * Math.sin(L * rad), Math.cos(L * rad)) / rad;
    var dec = Math.asin(Math.sin(e * rad) * Math.sin(L * rad)) / rad;
    var gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    var lst = (gmst * 15 + lon) % 360;
    var ha = (lst - ra) * rad;
    return Math.asin(Math.sin(lat * rad) * Math.sin(dec * rad) + Math.cos(lat * rad) * Math.cos(dec * rad) * Math.cos(ha)) / rad;
  }

  function themeForNow(date) {
    var alt = sunAltitude(date || new Date());
    if (alt > 12) return 'day';
    if (alt > -3) return 'golden';
    return 'night';
  }

  window.HubStyle = { buildStyle: buildStyle, themeForNow: themeForNow, sunAltitude: sunAltitude, themes: THEMES, wallImage: wallImage, groundImage: groundImage, roofImage: roofImage };
})();
