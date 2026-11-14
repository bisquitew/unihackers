import type { MapLayer, MapPin } from '@hub/map';
import { notifyMapLayersChanged } from '../../core/map-layers/changes';
import { api } from '../../core/api';

// Parking lots as a layer of the shared map. The map asks for layers synchronously, so the lots live in a small cache:
// filled from GET /v1/m/parkie/lots when the app starts, and refreshed when the map asks and the cache is older than a minute.
// Free-spot counts come from the lots' cameras (services/vision), so the pins stay current.
export interface Lot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  available_spots: number;
  status_color: 'green' | 'yellow' | 'red';
  last_updated?: string;
}

const MAX_AGE_MS = 60_000;
let lots: Lot[] = [];
let pins: MapPin[] = [];
let fetchedAt = 0;
let inflight: Promise<Lot[]> | null = null;

const toPin = (l: Lot): MapPin => ({
  id: l.id,
  kind: 'parking',
  layerId: 'parkie',
  coordinate: { latitude: l.latitude, longitude: l.longitude },
  title: l.name,
  subtitle: `${l.available_spots} of ${l.capacity} spots free`,
  visibility: 'public',
  owner: 'official',
  href: '/m/parkie',
  createdAt: l.last_updated || new Date().toISOString(),
});

/** Re-fetch the lots. Keeps the old ones if the API is unreachable. */
export function refreshLots(): Promise<Lot[]> {
  inflight ??= api
    .get<Lot[]>('/v1/m/parkie/lots')
    .then((r) => {
      if (Array.isArray(r) && r.length) {
        lots = r;
        pins = r.map(toPin);
        fetchedAt = Date.now();
        notifyMapLayersChanged();
      }
      return lots;
    })
    .catch(() => lots)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export const currentLots = () => lots;

export function parkieMapLayer(): MapLayer {
  if (Date.now() - fetchedAt > MAX_AGE_MS) void refreshLots();
  return { id: 'parkie', title: 'Parking', moduleId: 'parkie', pins, defaultVisible: true };
}

if (typeof window !== 'undefined') void refreshLots();

export const parkieManifest = {
  id: 'parkie',
  title: 'Parking',
  owner: 'P1' as const,
  status: 'live' as const,
  icon: 'parking',
  entryRoute: '/m/parkie',
  mapLayer: parkieMapLayer,
};

export default parkieManifest;
