// Where the map gets its layers. The map itself (@hub/map) knows nothing about modules: it draws whatever layers it is given.
//
// Modules contribute pins by exporting a `mapLayer` on their manifest (apps/app/src/modules/index.ts):
//     mapLayer: () => ({ id: 'events', title: 'Events', moduleId: 'm01-events', pins: [...] })
// `collectModuleLayers()` below calls every registered, enabled module's mapLayer. Until module owners add theirs,
// the layers in this folder (built from the mock data) stand in, so the map is never empty.
import { pinRef, type MapLayer, type MapPin, type PinKind } from '@hub/map';
import { registeredModuleManifests } from '../../modules';
import { alerts, type AlertItem } from '../mock/alerts';

const moduleToKind: Record<AlertItem['module'], PinKind> = {
  utilities: 'alert',
  transit: 'transit',
  smell: 'alert',
  safety: 'alert',
  // other illustration ids are not alert sources; fall back to 'alert'
} as Record<AlertItem['module'], PinKind>;

/** City alerts as a layer. Replace with P2's outage/detour endpoints (each alert has coordinates and a detail route). */
export function alertsLayer(): MapLayer {
  const pins: MapPin[] = alerts.map((a) => ({
    id: a.id,
    kind: moduleToKind[a.module] ?? 'alert',
    layerId: 'alerts',
    coordinate: a.coordinate,
    title: a.title,
    subtitle: a.detail,
    visibility: 'public',
    owner: 'official',
    href: `/alerts/${a.id}`,
    createdAt: '2026-11-13T15:05:00Z',
    demo: true,
  }));
  return { id: 'alerts', title: 'Alerts', moduleId: 'm04-utilities', pins, defaultVisible: true };
}

/** Layers contributed by registered modules through their manifest's `mapLayer`. Draft modules contribute nothing. */
export function collectModuleLayers(): MapLayer[] {
  const out: MapLayer[] = [];
  for (const manifest of registeredModuleManifests) {
    const provider = (manifest as { mapLayer?: unknown }).mapLayer;
    if (manifest.status === 'draft' || !provider) continue;
    try {
      const layer = typeof provider === 'function' ? (provider as () => MapLayer)() : (provider as MapLayer);
      if (layer && Array.isArray(layer.pins)) out.push(layer);
    } catch (err) {
      // one broken module must not take the map down
      console.warn(`map layer of ${manifest.id} failed`, err);
    }
  }
  return out;
}

/** Every layer the map shows, besides the user's own pins and the community layer (which @hub/map provides). */
export function allMapLayers(): MapLayer[] {
  const fromModules = collectModuleLayers();
  const hasAlerts = fromModules.some((l) => l.id === 'alerts');
  return hasAlerts ? fromModules : [alertsLayer(), ...fromModules];
}

export { pinRef };
