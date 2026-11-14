// The website's map is the same engine as the app (packages/map): an iframe talking over postMessage.
import { cap, isDark } from './ui.js';
import { CITY } from './city.js';

export function createMap(container, { onPinPress, interactive = true } = {}) {
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
  };
  const onTheme = () => send(themeCmd());
  window.addEventListener('message', onMessage);
  window.addEventListener('hop-theme', onTheme);

  return {
    setPins: (pins) => send({ type: 'setPins', pins }),
    /** the whole city in view */
    overview: () => send({ type: 'flyTo', lat: CITY.center.latitude, lng: CITY.center.longitude, zoom: CITY.overviewZoom }),
    select: (id) => send({ type: 'select', id }),
    /** the "you are here" marker; `heading` (degrees from north) turns it into a navigation arrow. null removes it. */
    setUserLocation: (loc) => send({ type: 'setUserLocation', location: loc ? { lat: loc.lat, lng: loc.lng, heading: loc.heading } : null }),
    flyTo: (lat, lng, zoom = 16) => send({ type: 'flyTo', lat, lng, zoom }),
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

/** Everything the map can show, as engine pins grouped by layer. */
export function buildLayers({ lots = [], outages = [], events = [], smell = [], areaAlerts = [] }) {
  const pin = (id, [lat, lng], artKey, title, kindLabel, extra = {}) => ({
    id,
    lat,
    lng,
    art: artKey,
    title,
    kindLabel,
    badge: '',
    ...extra
  });
  return {
    areaAlerts: {
      title: 'Danger & Construction',
      art: 'safety',
      pins: areaAlerts.map((a) => pin(
        `area-${a.id}`,
        [a.latitude, a.longitude],
        'safety',
        `${a.type === 'danger' ? '🚨' : '🚧'} ${a.title}`,
        `Rază: ${a.radius_meters}m • ${(a.affected_neighbourhoods || []).join(', ')}`,
        {
          radiusMeters: a.radius_meters,
          zoneType: a.type,
          fillColor: a.type === 'danger' ? '#ef4444' : '#f59e0b',
          strokeColor: a.type === 'danger' ? '#dc2626' : '#d97706',
          fillOpacity: a.type === 'danger' ? 0.25 : 0.20,
        }
      ))
    },
    parking: { title: 'Parking', art: 'parkie', pins: lots.map((l) => pin(`lot-${l.id}`, [l.latitude, l.longitude], 'parkie', l.name, `${l.available_spots} of ${l.capacity} free`)) },
    alerts: { title: 'City alerts', art: 'utilities', pins: outages.map((o, i) => pin(`out-${o.id ?? i}`, areaCoord(o.affected_areas?.[0]), 'utilities', o.title, cap(o.provider))) },
    events: { title: 'Events', art: 'events', pins: events.filter((e) => e.latitude && e.longitude).map((e) => pin(`evt-${e.id}`, [e.latitude, e.longitude], 'events', e.title, e.locationName || 'Event')) },
    smell: { title: 'Smell reports', art: 'smell', pins: smell.map((s, i) => pin(`sm-${s.id ?? i}`, [s.lat, s.lng], 'smell', `Smell: ${s.type}`, `Intensity ${s.intensity}/5`)) },
  };
}
