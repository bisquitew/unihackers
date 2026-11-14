// Deep links into the map, so any screen can open it focused on something without knowing how the map works.
//   router.push(mapHref({ pin: 'alerts:hot-water-garii-2' }))     // focus a layer's pin
//   router.push(mapHref({ lat: 45.7537, lng: 21.2272, zoom: 17 })) // focus a place
// Pins carry their own `href` for the way out (map -> screen).

export interface MapLink {
  /** `layerId:pinId`, as produced by pinRef() */
  pin?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
}

export const pinRef = (layerId: string, pinId: string) => `${layerId}:${pinId}`;

export function mapHref(link: MapLink): string {
  const q: string[] = [];
  if (link.pin) q.push(`pin=${encodeURIComponent(link.pin)}`);
  if (typeof link.lat === 'number' && typeof link.lng === 'number') {
    q.push(`lat=${link.lat}`, `lng=${link.lng}`);
    if (typeof link.zoom === 'number') q.push(`zoom=${link.zoom}`);
  }
  return `/map${q.length ? `?${q.join('&')}` : ''}`;
}

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined) => {
  const n = Number(first(v));
  return Number.isFinite(n) && first(v) !== undefined && first(v) !== '' ? n : undefined;
};

/** Read the same link back from expo-router's search params. */
export function parseMapLink(params: Params): MapLink {
  return { pin: first(params.pin), lat: num(params.lat), lng: num(params.lng), zoom: num(params.zoom) };
}
