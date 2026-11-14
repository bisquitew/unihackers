import AsyncStorage from '@react-native-async-storage/async-storage';

/** Small JSON wrapper around AsyncStorage (localStorage on web). Failing storage never breaks the map: reads fall back, writes are ignored. */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode, quota): keep working in memory */
  }
}

export const storageKeys = {
  personalPins: 'hop.map.pins.v1',
  communityPins: 'hop.map.community.v1',
  layerVisibility: 'hop.map.layers.v1',
} as const;
