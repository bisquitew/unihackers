// The person's own settings, saved on this device (AsyncStorage works on web, in Expo Go and in a built app).
// The shape is flat on purpose so it can be synced to the server later.
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MapTheme } from '@hub/map';

export interface Prefs {
  /** a name the person chose to show instead of the account name; empty = use the account name */
  displayName: string;
  mapTheme: MapTheme;
  notifySafety: boolean;
  notifyEvents: boolean;
  notifyCommunity: boolean;
}

const DEFAULTS: Prefs = { displayName: '', mapTheme: 'auto', notifySafety: true, notifyEvents: true, notifyCommunity: false };
const KEY = 'hop_prefs_v1';

let state: Prefs = DEFAULTS;
const listeners = new Set<() => void>();

void AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (!raw) return;
    state = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
    listeners.forEach((fn) => fn());
  })
  .catch(() => {});

export function setPrefs(patch: Partial<Prefs>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
  void AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}
