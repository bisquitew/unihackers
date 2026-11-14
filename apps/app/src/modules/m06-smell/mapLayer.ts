// Smell reports as a layer of P1's shared map (apps/app/src/core/map-layers, collectModuleLayers).
// The map asks for layers synchronously, so the pins live in a small cache here: filled from
// GET /v1/m/smell/pins when the app starts, refreshed after a report is sent and when the map asks
// for the layer and the cache is older than a minute. Each refresh tells the map to re-collect layers.
import type { MapLayer, MapPin } from '@hub/map';
import { notifyMapLayersChanged } from '../../core/map-layers/changes';
import { fetchPins, smellType, type SmellPin } from './api';

const LAYER_ID = 'm06-smell';
const HOURS = 24;
const MAX_AGE_MS = 60_000;

let pins: MapPin[] = [];
let fetchedAt = 0;
let inflight: Promise<void> | null = null;

function toMapPin(p: SmellPin): MapPin {
  const t = smellType(p.type);
  return {
    id: p.id,
    kind: 'smell',
    layerId: LAYER_ID,
    coordinate: { latitude: p.lat, longitude: p.lng },
    title: `Miros: ${t.label.toLowerCase()}`,
    subtitle: `${t.label}, intensitate ${p.intensity}/5`,
    visibility: 'public',
    owner: 'community',
    href: '/m/smell',
    createdAt: p.createdAt,
    demo: p.isDemo,
  };
}

/** Re-fetch the pins (demo included, last 24 h). Keeps the old pins if the API is unreachable. */
export function refreshSmellPins(): Promise<void> {
  inflight ??= fetchPins(HOURS, true)
    .then((r) => {
      pins = r.pins.map(toMapPin);
      fetchedAt = Date.now();
      notifyMapLayersChanged();
    })
    .catch((err) => {
      // keep the last pins; the next call retries
      console.warn('[m06-smell] could not load map pins', err);
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** What manifest.mapLayer returns: synchronous, from the cache. */
export function smellMapLayer(): MapLayer {
  if (Date.now() - fetchedAt > MAX_AGE_MS) void refreshSmellPins();
  return { id: LAYER_ID, title: 'Mirosuri', moduleId: 'm06-smell', pins, defaultVisible: true };
}

// Start loading as soon as the app starts (not during web static rendering, where there is no window).
if (typeof window !== 'undefined') void refreshSmellPins();
