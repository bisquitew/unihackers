// Events for [M01_EVENTS]. The API is the source of truth (GET/POST /v1/m/events, POST /v1/m/events/:id/rsvp). The list is
// kept in local storage as a cache so the app still opens with something to show when the server cannot be reached.
import { getCity } from '@hub/map';
import { api } from '../../core/api';
import { notifyMapLayersChanged } from '../../core/map-layers/changes';

export interface EventItem {
  id: string;
  title: string;
  category: 'cinema' | 'music' | 'workshop' | 'showcase' | 'social';
  locationName: string;
  neighbourhood: string;
  dateTime: string;
  description: string;
  attendeeCount: number;
  isFree: boolean;
  priceAmount?: number;
  ageGroup?: 'all' | 'students' | 'family';
  imageUrl?: string;
  /** exact spot, when the server knows it (the map prefers it over the middle of the neighbourhood) */
  latitude?: number;
  longitude?: number;
}

// middle of each neighbourhood, used as the spot of an event someone hosts without an exact address
const AREA_COORDS: Record<string, { latitude: number; longitude: number }> = {
  Fabric: { latitude: 45.7562, longitude: 21.2486 },
  Cetate: { latitude: 45.7537, longitude: 21.2272 },
  Iosefin: { latitude: 45.7489, longitude: 21.2184 },
  Elisabetin: { latitude: 45.7412, longitude: 21.2261 },
};

/** "2026-11-14T19:30:00Z" -> "Tonight at 19:30", "Tomorrow at 15:00", "Saturday at 18:00", "21 Nov at 09:00". Free text stays as it is. */
export function friendlyWhen(value: string, now = new Date()): string {
  const d = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}/.test(value) || Number.isNaN(d.getTime())) return value;
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayStart = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((dayStart(d) - dayStart(now)) / 86400000);
  if (days === 0) return `${d.getHours() >= 17 ? 'Tonight' : 'Today'} at ${time}`;
  if (days === 1) return `Tomorrow at ${time}`;
  if (days > 1 && days < 7) return `${d.toLocaleDateString('en-GB', { weekday: 'long' })} at ${time}`;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${time}`;
}

function fromApi(e: any): EventItem {
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    locationName: e.locationName,
    neighbourhood: e.neighbourhood,
    dateTime: friendlyWhen(e.dateTime),
    description: e.description,
    attendeeCount: e.attendeeCount ?? 0,
    isFree: !!e.isFree,
    priceAmount: e.priceAmount,
    ageGroup: ['all', 'students', 'family'].includes(e.ageGroup) ? e.ageGroup : 'all',
    imageUrl: e.imageUrl,
    latitude: e.latitude,
    longitude: e.longitude,
  };
}

const STORAGE_KEY = 'timisoara_hub_events_v1';

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-001',
    title: 'Underground Indie Cinema Night',
    category: 'cinema',
    locationName: 'Faber Community Yard',
    neighbourhood: 'Fabric',
    dateTime: 'Tonight at 19:30',
    description: 'Outdoor screening of independent short films. Warm spiced cider, cozy fires, and discussion with directors.',
    attendeeCount: 38,
    isFree: true,
    ageGroup: 'students',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
  },
  {
    id: 'evt-002',
    title: 'Beginner Pottery & Clay Jam',
    category: 'workshop',
    locationName: 'Scârț Loc Lejer',
    neighbourhood: 'Elisabetin',
    dateTime: 'Tomorrow at 15:00',
    description: 'Casual pottery and clay shaping workshop designed for students and newcomers. All clay and pottery materials included.',
    attendeeCount: 16,
    isFree: false,
    priceAmount: 25,
    ageGroup: 'all',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80',
  },
  {
    id: 'evt-003',
    title: 'Sunset Acoustic & Jazz Session',
    category: 'music',
    locationName: 'D’arc pe Mal',
    neighbourhood: 'Iosefin',
    dateTime: 'Saturday at 18:00',
    description: 'Local student musicians playing acoustic indie and jazz standards right on the wooden deck along the Bega canal.',
    attendeeCount: 45,
    isFree: true,
    ageGroup: 'students',
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&q=80',
  },
];

class EventsStore {
  private events: EventItem[] = INITIAL_EVENTS;
  private listeners: Set<() => void> = new Set();
  private isLoaded = false;

  constructor() {
    this.loadFromStorage();
    void this.refresh();
  }

  /** Loads the current events from the API. Keeps what is on screen when the server cannot be reached. */
  async refresh(): Promise<void> {
    try {
      const { events } = await api.get<{ events: any[] }>('/v1/m/events');
      if (Array.isArray(events) && events.length) {
        this.events = events.map(fromApi);
        this.saveToStorage();
      }
    } catch {
      /* offline: the cached list stays */
    }
  }

  private loadFromStorage() {
    if (this.isLoaded) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.events = parsed;
          }
        }
      }
    } catch (err) {
      console.warn('[EventsStore] Storage read fallback:', err);
    }
    this.isLoaded = true;
  }

  private saveToStorage() {
    // the map's events layer is built from this list, so it is told whenever the list changes
    queueMicrotask(notifyMapLayersChanged);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
      }
    } catch (err) {
      console.warn('[EventsStore] Storage write fallback:', err);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[EventsStore] Listener error:', err);
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getEvents(): EventItem[] {
    return [...this.events];
  }

  createEvent(data: {
    title: string;
    category: 'cinema' | 'music' | 'workshop' | 'showcase' | 'social';
    locationName: string;
    neighbourhood: string;
    dateTime: string;
    description: string;
    isFree: boolean;
    priceAmount?: number;
    ageGroup?: 'all' | 'students' | 'family';
    imageUrl?: string;
    organizerName?: string;
  }): EventItem {
    const newEvent: EventItem = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      category: data.category,
      locationName: data.locationName.trim() || 'Community hub',
      neighbourhood: data.neighbourhood || 'Cetate',
      dateTime: data.dateTime.trim() || 'Upcoming',
      description: data.description.trim(),
      attendeeCount: 1,
      isFree: data.isFree,
      priceAmount: data.priceAmount,
      ageGroup: data.ageGroup || 'all',
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
      ...(AREA_COORDS[data.neighbourhood] ?? {}),
    };

    this.events = [newEvent, ...this.events];
    this.saveToStorage();

    // shown at once; the server's copy (with its own id) replaces it when the post goes through
    void this.postToApi(newEvent, data.organizerName);

    return newEvent;
  }

  /** Reserves a place. The server counts it; the list is refreshed from there. */
  rsvpEvent(eventId: string, userName = 'Resident', lookingForBuddy = false): void {
    this.events = this.events.map((e) => (e.id === eventId ? { ...e, attendeeCount: e.attendeeCount + 1 } : e));
    this.saveToStorage();
    api
      .post(`/v1/m/events/${encodeURIComponent(eventId)}/rsvp`, { userName, lookingForBuddy })
      .then(() => this.refresh())
      .catch(() => {
        /* offline or not signed in: the count stays local */
      });
  }

  /** Finds the venue on the map (by name and neighbourhood) and moves the event there. Keeps the neighbourhood's middle if it is not found. */
  private async placeOnMap(evt: EventItem): Promise<EventItem> {
    try {
      const found = await api.get<{ found: boolean; latitude?: number; longitude?: number }>('/v1/core/geocode', { q: `${evt.locationName}, ${evt.neighbourhood}, ${getCity().name}` });
      if (found.found && typeof found.latitude === 'number' && typeof found.longitude === 'number') {
        const placed = { ...evt, latitude: found.latitude, longitude: found.longitude };
        this.events = this.events.map((e) => (e.id === evt.id ? placed : e));
        this.saveToStorage();
        return placed;
      }
    } catch {
      /* offline, not signed in, or the lookup failed */
    }
    return evt;
  }

  private async postToApi(local: EventItem, organizerName = 'Resident') {
    const evt = await this.placeOnMap(local);
    try {
      await api.post('/v1/m/events', {
        title: evt.title,
        description: evt.description,
        category: evt.category,
        locationName: evt.locationName,
        address: evt.locationName,
        neighbourhood: evt.neighbourhood,
        latitude: evt.latitude ?? AREA_COORDS.Cetate.latitude,
        longitude: evt.longitude ?? AREA_COORDS.Cetate.longitude,
        dateTime: evt.dateTime,
        ageGroup: evt.ageGroup,
        organizerName,
        isFree: evt.isFree,
        priceAmount: evt.priceAmount,
        imageUrl: evt.imageUrl,
      });
      await this.refresh();
    } catch {
      /* not signed in or offline: the event stays on this phone only */
    }
  }
}

export const eventsStore = new EventsStore();
