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

/**
 * The signed-in user's own pins, saved on the device (works offline and in Expo Go).
 * The shape matches MapPin so it can be synced to the server later (P2's /v1/core/user/places).
 */
export function usePersonalPins() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [ready, setReady] = useState(false);
  const ref = useRef<MapPin[]>([]);
  ref.current = pins;

  useEffect(() => {
    let alive = true;
    void readJson<MapPin[]>(storageKeys.personalPins, []).then((saved) => {
      if (!alive) return;
      setPins(saved);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) void writeJson(storageKeys.personalPins, pins);
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
