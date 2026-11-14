// Shared Persistent Events Store for [M01_EVENTS]
// Supports browser localStorage persistence and background sync with backend API

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
    };

    this.events = [newEvent, ...this.events];
    this.saveToStorage();

    // Fire-and-forget sync to backend API if available
    this.syncCreateToBackend(newEvent).catch(() => {});

    return newEvent;
  }

  rsvpEvent(eventId: string): void {
    this.events = this.events.map((e) => {
      if (e.id === eventId) {
        return { ...e, attendeeCount: e.attendeeCount + 1 };
      }
      return e;
    });
    this.saveToStorage();
  }

  private async syncCreateToBackend(evt: EventItem) {
    try {
      await fetch('http://localhost:8000/v1/m/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt),
      });
    } catch {
      // Backend offline: event is safely saved in local storage
    }
  }
}

export const eventsStore = new EventsStore();
