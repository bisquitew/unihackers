import { useCallback, useEffect, useRef, useState } from 'react';
import { sharePin, unsharePin } from './community';
import { effectiveVisibility, pinKinds } from './kinds';
import { readJson, storageKeys, writeJson } from './storage';
import type { Coordinate, MapPin, PinKind, PinVisibility } from './types';

export interface NewPin {
  kind: PinKind;
  title: string;
  subtitle?: string;
  coordinate: Coordinate;
  /** ignored when the kind does not allow it: Home and Work can never become public */
  visibility?: PinVisibility;
}

export type PinPatch = Partial<Pick<MapPin, 'title' | 'subtitle' | 'coordinate' | 'visibility'>>;

const newId = () => `me-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** How the app keeps a person's pins on the server (the map package knows nothing about the API). */
export interface PinsSync {
  load: () => Promise<MapPin[] | null>;
  save: (pins: MapPin[]) => Promise<void>;
}
let sync: PinsSync | null = null;
/** The app registers this once; pins then follow the account across devices. Returns an unregister. */
export function registerPinsSync(adapter: PinsSync): () => void {
  sync = adapter;
  return () => {
    if (sync === adapter) sync = null;
  };
}

/**
 * The signed-in user's own pins. Saved on the device (works offline) and, when the app has registered a PinsSync,
 * on the server too: on start the server's list is merged in, and every change is sent back.
 */
export function usePersonalPins() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [ready, setReady] = useState(false);
  const ref = useRef<MapPin[]>([]);
  ref.current = pins;

  useEffect(() => {
    let alive = true;
    void readJson<MapPin[]>(storageKeys.personalPins, []).then(async (saved) => {
      if (!alive) return;
      let merged = saved;
      const remote = sync ? await sync.load().catch(() => null) : null;
      if (remote) {
        // the server's pins win; pins made offline on this device are kept and sent up
        const ids = new Set(remote.map((p) => p.id));
        merged = [...remote, ...saved.filter((p) => !ids.has(p.id))];
      }
      if (!alive) return;
      setPins(merged);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void writeJson(storageKeys.personalPins, pins);
    // sent to the server shortly after the last change
    const t = setTimeout(() => void sync?.save(pins).catch(() => {}), 800);
    return () => clearTimeout(t);
  }, [pins, ready]);

  const add = useCallback((input: NewPin): MapPin => {
    const visibility = effectiveVisibility(input.kind, input.visibility);
    const pin: MapPin = {
      id: newId(),
      kind: input.kind,
      layerId: 'mine',
      coordinate: input.coordinate,
      title: input.title.trim() || pinKinds[input.kind].label,
      subtitle: input.subtitle?.trim() || undefined,
      visibility,
      owner: 'me',
      createdAt: new Date().toISOString(),
    };
    setPins((p) => [pin, ...p]);
    if (visibility === 'public') void sharePin(pin);
    return pin;
  }, []);

  const update = useCallback((id: string, patch: PinPatch) => {
    const old = ref.current.find((p) => p.id === id);
    if (!old) return;
    const visibility = effectiveVisibility(old.kind, patch.visibility ?? old.visibility);
    const next: MapPin = {
      ...old,
      ...patch,
      title: (patch.title ?? old.title).trim() || pinKinds[old.kind].label,
      visibility,
    };
    setPins((all) => all.map((p) => (p.id === id ? next : p)));
    if (visibility === 'public') void sharePin(next);
    else if (old.visibility === 'public') void unsharePin(old);
  }, []);

  const remove = useCallback((id: string) => {
    const old = ref.current.find((p) => p.id === id);
    setPins((all) => all.filter((p) => p.id !== id));
    if (old?.visibility === 'public') void unsharePin(old);
  }, []);

  return { pins, ready, add, update, remove };
}
