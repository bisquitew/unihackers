// Safety reports as a layer of P1's shared map (apps/app/src/core/map-layers, collectModuleLayers).
// Same approach as m06-smell: the map asks for layers synchronously, so the pins live in a small cache here,
// filled from GET /v1/m/safety/pins when the app starts, refreshed after a report is sent and when the map asks
// for the layer and the cache is older than a minute. Each refresh tells the map to re-collect layers.
import type { MapLayer, MapPin } from '@hub/map';
import { notifyMapLayersChanged } from '../../core/map-layers/changes';
import { fetchPins, safetyType, type SafetyPin } from './api';

const LAYER_ID = 'm03-safety';
const HOURS = 168; // one week
const MAX_AGE_MS = 60_000;

let pins: MapPin[] = [];
let fetchedAt = 0;
let inflight: Promise<void> | null = null;

function toMapPin(p: SafetyPin): MapPin {
  const t = safetyType(p.type);
  return {
    id: p.id,
    kind: 'safety',
    layerId: LAYER_ID,
    coordinate: { latitude: p.lat, longitude: p.lng },
    title: `Siguranță: ${t.label.toLowerCase()}`,
    subtitle: `${t.label}, sesizare a unui locuitor`,
    visibility: 'public',
    owner: 'community',
    href: '/m/safety',
    createdAt: p.createdAt,
    demo: p.isDemo,
  };
}

/** Re-fetch the pins (demo included, last 7 days). Keeps the old pins if the API is unreachable. */
export function refreshSafetyPins(): Promise<void> {
  inflight ??= fetchPins(HOURS, true)
    .then((r) => {
      pins = r.pins.map(toMapPin);
      fetchedAt = Date.now();
      notifyMapLayersChanged();
    })
    .catch((err) => {
      // keep the last pins; the next call retries
      console.warn('[m03-safety] could not load map pins', err);
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** What manifest.mapLayer returns: synchronous, from the cache. */
export function safetyMapLayer(): MapLayer {
  if (Date.now() - fetchedAt > MAX_AGE_MS) void refreshSafetyPins();
  return { id: LAYER_ID, title: 'Siguranță', moduleId: 'm03-safety', pins, defaultVisible: true };
}

// Start loading as soon as the app starts (not during web static rendering, where there is no window).
if (typeof window !== 'undefined') void refreshSafetyPins();
