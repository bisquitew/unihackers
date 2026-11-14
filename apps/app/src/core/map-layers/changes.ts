// Lets a module tell the map that its layer's pins changed (for example after a fetch), so the Map tab
// calls collectModuleLayers() again. No imports on purpose: modules can use it without an import cycle.
// Shaped for React.useSyncExternalStore(onMapLayersChanged, getMapLayersVersion), which also catches
// changes that happen between the first render and the subscription.
type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

/** Returns the unsubscribe function. */
export function onMapLayersChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Changes every time a module reports new pins. */
export function getMapLayersVersion(): number {
  return version;
}

/** Modules call this after their pins changed. */
export function notifyMapLayersChanged(): void {
  version++;
  listeners.forEach((listener) => listener());
}
