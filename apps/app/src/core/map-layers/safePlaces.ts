// Safe places as a layer of the shared map: hospitals, police stations and fire stations, drawn as small icons (the map engine
// draws pins of these kinds as symbols, like the drinking fountains). The list comes from GET /v1/m/safety/places and is cached
// here because the map asks for layers synchronously; each refresh tells the map to collect layers again.
import type { MapLayer, MapPin } from '@hub/map';
import { api } from '../api';
import { notifyMapLayersChanged } from './changes';

interface SafePlace {
  id: string;
  kind: 'hospital' | 'police' | 'fire';
  name: string;
  latitude: number;
  longitude: number;
  emergency: boolean;
  street: string | null;
}

const LABEL = { hospital: 'Hospital', police: 'Police station', fire: 'Fire station' } as const;

let pins: MapPin[] = [];
let fetchedAt = 0;
let inflight: Promise<void> | null = null;
const MAX_AGE_MS = 10 * 60_000;

function toPin(p: SafePlace): MapPin {
  const what = p.kind === 'hospital' && p.emergency ? 'Hospital with emergency care' : LABEL[p.kind];
  return {
    id: `safe-${p.id}`,
    kind: p.kind,
    layerId: 'safe',
    coordinate: { latitude: p.latitude, longitude: p.longitude },
    title: p.name,
    subtitle: `${what}${p.street ? `, ${p.street}` : ''}. In an emergency call 112.`,
    visibility: 'public',
    owner: 'official',
    createdAt: new Date().toISOString(),
  };
}

export function refreshSafePlaces(): Promise<void> {
  inflight ??= api
    .get<{ places: SafePlace[] }>('/v1/m/safety/places')
    .then((r) => {
      if (Array.isArray(r.places) && r.places.length) {
        pins = r.places.map(toPin);
        fetchedAt = Date.now();
        notifyMapLayersChanged();
      }
    })
    .catch(() => {})
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** The layer the map shows. Starts loading on first use and refreshes now and then. */
export function safePlacesLayer(): MapLayer {
  if (Date.now() - fetchedAt > MAX_AGE_MS) void refreshSafePlaces();
  return { id: 'safe', title: 'Safe places', moduleId: 'm03-safety', pins, defaultVisible: true };
}
