import type { Coordinate, MapLayer, MapPin } from '@hub/map';
import { eventsStore, type EventItem } from './eventsStore';

// Where each seeded event is held. Events made in the app have no exact spot, so they sit in the middle of their area.
const SPOTS: Record<string, Coordinate> = {
  'evt-001': { latitude: 45.7562, longitude: 21.2486 },
  'evt-002': { latitude: 45.7412, longitude: 21.2261 },
  'evt-003': { latitude: 45.7489, longitude: 21.2184 },
};
const AREA_CENTRES: Record<string, Coordinate> = {
  Fabric: { latitude: 45.7562, longitude: 21.2486 },
  Cetate: { latitude: 45.7537, longitude: 21.2272 },
  Iosefin: { latitude: 45.7489, longitude: 21.2184 },
  Elisabetin: { latitude: 45.7412, longitude: 21.2261 },
};

export function eventCoordinate(event: EventItem): Coordinate | null {
  return SPOTS[event.id] ?? AREA_CENTRES[event.neighbourhood] ?? null;
}

/** The Events module's contribution to the map: one pin per event, opening that event in the Community tab. */
export function eventsMapLayer(): MapLayer {
  const pins: MapPin[] = eventsStore.getEvents().flatMap((e): MapPin[] => {
    const coordinate = eventCoordinate(e);
    if (!coordinate) return [];
    return [
      {
        id: e.id,
        kind: 'event',
        layerId: 'events',
        coordinate,
        title: e.title,
        subtitle: `${e.dateTime}, ${e.locationName}`,
        visibility: 'public',
        owner: 'official',
        href: `/(tabs)/community?tab=events&event=${e.id}`,
        createdAt: new Date().toISOString(),
        demo: SPOTS[e.id] !== undefined,
      },
    ];
  });
  return { id: 'events', title: 'Events', moduleId: 'm01-events', pins, defaultVisible: true };
}
