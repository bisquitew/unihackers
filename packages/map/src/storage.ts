// Resilient storage adapter: works on Web (localStorage), native, and in-memory.
const memoryStore = new Map<string, string>();

interface SimpleStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
}

const storageImpl: SimpleStorage = {
  getItem: (key: string) => {
    if (typeof localStorage !== 'undefined') {
      try { return localStorage.getItem(key); } catch {}
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, val: string) => {
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, val); return; } catch {}
    }
    memoryStore.set(key, val);
  }
};

/** Small JSON wrapper around storage (localStorage on web, in-memory fallback). Failing storage never breaks the map: reads fall back, writes are ignored. */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await storageImpl.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await storageImpl.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode, quota): keep working in memory */
  }
}

export const storageKeys = {
  personalPins: 'hop.map.pins.v1',
  communityPins: 'hop.map.community.v1',
  layerVisibility: 'hop.map.layers.v1',
} as const;
