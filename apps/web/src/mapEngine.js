// The website's map is the same engine as the app (packages/map): an iframe talking over postMessage.
import { cap, isDark } from './ui.js';
import { dateLocale } from './i18n.js';
import { CITY } from './city.js';

export function createMap(container, { onPinPress, onTap, interactive = true } = {}) {
  const frame = document.createElement('iframe');
  frame.src = './map-engine.html';
  frame.title = `Map of ${CITY.name}`;
  frame.className = 'map-frame';
  if (!interactive) frame.style.pointerEvents = 'none';
  container.appendChild(frame);

  let ready = false;
  const queue = [];
  const send = (cmd) => (ready ? frame.contentWindow?.postMessage({ hubMapCmd: cmd }, '*') : queue.push(cmd));
  // the map follows the site's theme: day colours in light mode, night colours in dark mode (not the clock)
  const themeCmd = () => ({ type: 'setTheme', theme: isDark() ? 'night' : 'day' });

  const onMessage = (ev) => {
    if (ev.source !== frame.contentWindow || !ev.data?.hubMap) return;
    const msg = ev.data.msg;
    if (msg.type === 'ready') {
      ready = true;
      // tell the map which city it shows (where it opens, how far it can be dragged) before anything else
      frame.contentWindow?.postMessage({ hubMapCmd: { type: 'setCity', lat: CITY.center.latitude, lng: CITY.center.longitude, zoom: CITY.zoom, bounds: CITY.bounds } }, '*');
      send(themeCmd());
      queue.splice(0).forEach((c) => frame.contentWindow?.postMessage({ hubMapCmd: c }, '*'));
    } else if (msg.type === 'pinPress') onPinPress?.(msg.id);
    else if (msg.type === 'tap') onTap?.();
  };
  const onTheme = () => send(themeCmd());
  window.addEventListener('message', onMessage);
  window.addEventListener('hop-theme', onTheme);

  return {
    setPins: (pins) => send({ type: 'setPins', pins }),
    /** the whole city in view */
    overview: () => send({ type: 'flyTo', lat: CITY.center.latitude, lng: CITY.center.longitude, zoom: CITY.overviewZoom }),
    select: (id) => send({ type: 'select', id }),
    /** a route to draw as a line and zoom to: [[lng, lat], ...]. null clears it. */
    setRoute: (coords) => send({ type: 'setRoute', coords }),
    /** the "you are here" marker; `heading` (degrees from north) turns it into a navigation arrow. null removes it. */
    setUserLocation: (loc) => send({ type: 'setUserLocation', location: loc ? { lat: loc.lat, lng: loc.lng, heading: loc.heading } : null }),
    flyTo: (lat, lng, zoom = 16) => send({ type: 'flyTo', lat, lng, zoom }),
    /** space covered by panels on top of the map, so a picked pin is centred in what is left */
    setInsets: (i) => send({ type: 'setInsets', top: i.top || 0, right: i.right || 0, bottom: i.bottom || 0, left: i.left || 0 }),
    destroy() {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('hop-theme', onTheme);
      frame.remove();
    },
  };
}

// Approximate spots for outage areas (the API gives area names, not coordinates)
const AREAS = {
  Circumvalațiunii: [45.762, 21.218], Circumvalatiunii: [45.762, 21.218], Mehala: [45.7705, 21.2105],
  'Complex Studențesc': [45.748, 21.239], 'Calea Șagului': [45.732, 21.205], 'Calea Aradului': [45.772, 21.224],
  Iosefin: [45.745, 21.209], Fabric: [45.7533, 21.2508], Cetate: [45.7537, 21.2272], Elisabetin: [45.7412, 21.2261],
};
export const areaCoord = (name) => AREAS[name] || [45.7537, 21.2257];

/** One pin for the engine. `extra` carries what a pin shows when it is opened and, for zones, the circle around it. */
export const makePin = (id, [lat, lng], artKey, title, kindLabel, extra = {}) => ({ id, lat, lng, art: artKey, title, kindLabel, badge: '', ...extra });

/** Everything the map can show, as engine pins grouped by layer. */
/**
 * Several people reporting the same issue close together are one problem: pins of the same kind and title within 150 m
 * become one bigger pin with the number of reports (the engine draws it with a ring). Others' reports only.
 */
export function groupSimilarPins(pins, { radius = 150, minCount = 2, groupable = (p) => p.reportKind } = {}) {
  const metres = (a, b) => {
    const R = 6371000;
    const rad = (d) => (d * Math.PI) / 180;
    const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const plain = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  // issues that affect a whole neighbourhood (smoke, sewage, noise...) group over a wider area
  const wide = { smoke: 500, 'burnt rubber': 500, chemical: 500, sewage: 400, 'noise at night': 400 };
  const reachOf = (p) => Math.max(radius, wide[plain(p.issue || p.title)] || 0);
  const candidates = pins.filter(groupable).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const clusters = [];
  for (const p of candidates) {
    const key = `${p.reportKind}|${plain(p.title)}`;
    const home = clusters.find((c) => c.key === key && metres(c.centre, p) <= reachOf(p));
    if (home) {
      home.members.push(p);
      home.centre = { lat: home.members.reduce((t, m) => t + m.lat, 0) / home.members.length, lng: home.members.reduce((t, m) => t + m.lng, 0) / home.members.length };
    } else clusters.push({ key, members: [p], centre: { lat: p.lat, lng: p.lng } });
  }
  const replace = new Map();
  const dropped = new Set();
  for (const c of clusters) {
    if (c.members.length < minCount) continue;
    const first = c.members[0];
    const n = c.members.length;
    replace.set(first.id, { ...first, id: `hot-${[...c.members.map((m) => m.id)].sort()[0]}`, lat: c.centre.lat, lng: c.centre.lng, count: n, kindLabel: `${n} reports`,
      desc: `${n} neighbours reported this here. In the last 24 hours.` });
    c.members.slice(1).forEach((m) => dropped.add(m.id));
  }
  return replace.size ? pins.filter((p) => !dropped.has(p.id)).map((p) => replace.get(p.id) || p) : pins;
}

export function buildLayers({ lots = [], outages = [], events = [], smell = [], areaAlerts = [], safePlaces = [] }) {
  // `extra` carries what a pin shows when it is opened (`desc`, `link: { label, href }`) and, for danger and works zones,
  // the circle drawn around it (radiusMeters, zoneType; the engine colours it: apricot for danger, blue for works)
  const pin = makePin;
  return {
    areaAlerts: {
      title: 'Danger and works',
      art: 'safety',
      pins: areaAlerts.map((a) => pin(
        `area-${a.id}`,
        [a.latitude, a.longitude],
        'safety',
        String(a.title).replace(/^[^\p{L}\p{N}]+/u, ''),
        `${a.type === 'danger' ? 'Danger zone' : 'Works zone'} · ${a.radius_meters} m`,
        {
          desc: [a.description, a.expected_end_time ? `Expected to end ${new Date(a.expected_end_time).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' })}.` : ''].filter(Boolean).join('\n\n'),
          link: { label: 'All alerts', href: '#/alerts' },
          radiusMeters: a.radius_meters,
          zoneType: a.type,
        }
      ))
    },
    // hospitals, police stations and fire stations: drawn on the map as small icons, like the drinking fountains
    safe: {
      title: 'Safe places',
      art: 'safety',
      pins: safePlaces.map((p) => pin(`safe-${p.id}`, [p.latitude, p.longitude], 'safety', p.name,
        p.kind === 'hospital' && p.emergency ? 'Hospital with emergency care' : { hospital: 'Hospital', police: 'Police station', fire: 'Fire station' }[p.kind],
        { symbol: p.kind, desc: `${p.street ? `${p.street}. ` : ''}In an emergency call 112.` })),
    },
    parking: { title: 'Parking', art: 'parkie', pins: lots.map((l) => pin(`lot-${l.id}`, [l.latitude, l.longitude], 'parkie', l.name, `${l.available_spots} of ${l.capacity} free`, { desc: `${l.available_spots} of ${l.capacity} spots are free right now, counted from the lot's camera.`, link: { label: 'All parking', href: '#/parkie' } })) },
    alerts: { title: 'City alerts', art: 'utilities', pins: outages.map((o, i) => pin(`out-${o.id ?? i}`, areaCoord(o.affected_areas?.[0]), 'utilities', o.title, cap(o.provider), { desc: [o.description, (o.affected_areas || []).length ? `Affected: ${o.affected_areas.join(', ')}.` : '', o.estimated_restore_time ? `Expected back about ${new Date(o.estimated_restore_time).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })}.` : ''].filter(Boolean).join('\n\n'), link: { label: 'All alerts', href: '#/alerts' } })) },
    events: { title: 'Events', art: 'events', pins: events.filter((e) => e.latitude && e.longitude).map((e) => pin(`evt-${e.id}`, [e.latitude, e.longitude], 'events', e.title, e.locationName || 'Event', { desc: [e.description, `${e.locationName || ''}${e.dateTime ? ` · ${new Date(e.dateTime).toLocaleString(dateLocale(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}`].filter(Boolean).join('\n\n'), link: { label: 'Open in Community', href: '#/community' } })) },
    smell: { title: 'Smell reports', art: 'smell', pins: smell.map((s, i) => pin(`sm-${s.id ?? i}`, [s.lat, s.lng], 'smell', `Smell: ${String(s.type || '').replace(/_/g, ' ')}`, `Intensity ${s.intensity}/5`, { desc: 'Reported by a resident in the last 24 hours.', reportKind: 'smell', issue: String(s.type || '').replace(/_/g, ' '), createdAt: s.createdAt })) },
  };
}
