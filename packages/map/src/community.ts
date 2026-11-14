import { useEffect, useState } from 'react';
import { pinKinds, roundForSharing } from './kinds';
import { readJson, storageKeys, writeJson } from './storage';
import type { MapPin, PinKind } from './types';

/**
 * Sharing. A pin whose kind allows it can be made public. Public pins are shared as an anonymous copy
 * with the coordinates snapped to a grid, so the exact spot (and the author) are not exposed.
 *
 * Today there is no server for shared pins, so copies go to a local demo store. Owners of the real modules
 * (safety, smell, forum, buddy) replace this by registering an adapter for their kind:
 *     registerShareAdapter('safety', async (pin) => api.safety.report(pin));
 */
export type ShareAdapter = (sharedCopy: MapPin) => Promise<void> | void;
export type UnshareAdapter = (sharedId: string) => Promise<void> | void;

const adapters: Partial<Record<PinKind, { share: ShareAdapter; unshare?: UnshareAdapter }>> = {};

export function registerShareAdapter(kind: PinKind, share: ShareAdapter, unshare?: UnshareAdapter): () => void {
  const entry = { share, unshare };
  adapters[kind] = entry;
  return () => {
    if (adapters[kind] === entry) delete adapters[kind];
  };
}

export const sharedIdFor = (personalId: string) => `shared-${personalId}`;

/** The anonymous, rounded copy that leaves the device. */
export function toSharedCopy(pin: MapPin): MapPin {
  const meters = pinKinds[pin.kind].sharePrecisionMeters;
  return {
    ...pin,
    id: sharedIdFor(pin.id),
    layerId: 'community',
    owner: 'community',
    visibility: 'public',
    coordinate: meters ? roundForSharing(pin.coordinate, meters) : pin.coordinate,
  };
}

/* ---------- local demo store (stands in for the server) ---------- */
const seeds: MapPin[] = [
  { id: 'demo-safety-1', kind: 'safety', layerId: 'community', owner: 'community', visibility: 'public', title: 'Underpass is poorly lit', subtitle: 'Near Gara de Nord.', coordinate: { latitude: 45.7497, longitude: 21.2093 }, createdAt: '2026-11-13T18:00:00Z', demo: true },
  { id: 'demo-lost-1', kind: 'lostFound', layerId: 'community', owner: 'community', visibility: 'public', title: 'Grey cat seen near the park', coordinate: { latitude: 45.7546, longitude: 21.2301 }, createdAt: '2026-11-13T17:20:00Z', demo: true },
  { id: 'demo-smell-1', kind: 'smell', layerId: 'community', owner: 'community', visibility: 'public', title: 'Burnt smell this morning', coordinate: { latitude: 45.7612, longitude: 21.2551 }, createdAt: '2026-11-13T07:15:00Z', demo: true },
  { id: 'demo-meetup-1', kind: 'meetup', layerId: 'community', owner: 'community', visibility: 'public', title: 'Board games on Thursdays', subtitle: 'Piața Unirii.', coordinate: { latitude: 45.7579, longitude: 21.229 }, createdAt: '2026-11-12T16:00:00Z', demo: true },
];

let stored: MapPin[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

async function load() {
  if (loaded) return;
  loaded = true;
  stored = await readJson<MapPin[]>(storageKeys.communityPins, []);
  notify();
}

async function persist() {
  await writeJson(storageKeys.communityPins, stored);
  notify();
}

async function demoShare(copy: MapPin) {
  await load();
  stored = [...stored.filter((p) => p.id !== copy.id), { ...copy, demo: true }];
  await persist();
}

async function demoUnshare(sharedId: string) {
  await load();
  stored = stored.filter((p) => p.id !== sharedId);
  await persist();
}

/** Share a personal pin (call only when its visibility is public). */
export async function sharePin(pin: MapPin): Promise<void> {
  const copy = toSharedCopy(pin);
  const adapter = adapters[pin.kind];
  if (adapter) await adapter.share(copy);
  else await demoShare(copy);
}

/** Withdraw a previously shared pin (when it is deleted or made private). */
export async function unsharePin(pin: MapPin): Promise<void> {
  const adapter = adapters[pin.kind];
  if (adapter?.unshare) await adapter.unshare(sharedIdFor(pin.id));
  else if (!adapter) await demoUnshare(sharedIdFor(pin.id));
}

/** Pins shared by other residents (seed samples plus anything shared on this device). */
export function useCommunityPins(): MapPin[] {
  const [, force] = useState(0);
  useEffect(() => {
    void load();
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return [...seeds, ...stored];
}
