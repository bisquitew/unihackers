import type { User, SavedPlace } from '@hub/contracts';
import { findMatchingArea } from './areas.ts';

const USERS_STORE: Map<string, User> = new Map();
const SAVED_PLACES_STORE: Map<string, SavedPlace[]> = new Map();

// Seed initial test resident
const TEST_RESIDENT_ID = '11111111-2222-3333-4444-555555555555';
USERS_STORE.set(TEST_RESIDENT_ID, {
  id: TEST_RESIDENT_ID,
  auth0_id: 'auth0|dev-resident-01',
  email: 'resident@timisoara-hub.ro',
  name: 'Andrei Timișan',
  role: 'resident',
  neighbourhood: 'Circumvalațiunii',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

SAVED_PLACES_STORE.set(TEST_RESIDENT_ID, [
  {
    id: 'place-home-01',
    user_id: TEST_RESIDENT_ID,
    label: 'Acasă',
    address: 'Strada Circumvalațiunii 14, Timișoara',
    latitude: 45.7618,
    longitude: 21.2185,
    area_id: 'area-circumvalatiunii',
    notify_utilities: true,
    notify_transit: true
  }
]);

export const userService = {
  getUserById(id: string): User | undefined {
    return USERS_STORE.get(id);
  },

  getUserByAuth0Id(auth0Id: string): User | undefined {
    return Array.from(USERS_STORE.values()).find((u) => u.auth0_id === auth0Id);
  },

  upsertUser(user: User): User {
    USERS_STORE.set(user.id, user);
    return user;
  },

  getSavedPlaces(userId: string): SavedPlace[] {
    return SAVED_PLACES_STORE.get(userId) || [];
  },

  addSavedPlace(userId: string, place: Omit<SavedPlace, 'id' | 'user_id' | 'area_id'>): SavedPlace {
    const area = findMatchingArea(place.latitude, place.longitude);
    const newPlace: SavedPlace = {
      ...place,
      id: crypto.randomUUID(),
      user_id: userId,
      area_id: area?.id
    };

    const userPlaces = SAVED_PLACES_STORE.get(userId) || [];
    userPlaces.push(newPlace);
    SAVED_PLACES_STORE.set(userId, userPlaces);

    return newPlace;
  }
};
