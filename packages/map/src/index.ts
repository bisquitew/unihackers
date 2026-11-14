// @hub/map: the city map. It runs on its own and connects to the rest of the app through four small seams:
//   1. <CityMap pins=... />                       draw any pins, receive taps
//   2. MapLayer / ModuleManifest.mapLayer         modules contribute pins
//   3. pin kinds + visibility policy (kinds.ts)    what a pin looks like and who may see it
//   4. mapHref / parseMapLink (link.ts)           open the map focused on something, and pins link back out
export { CityMap } from './CityMap';
export type { CityMapProps, EnginePin } from './bridge';
export * from './types';
export * from './kinds';
export * from './link';
export { usePersonalPins, type NewPin, type PinPatch } from './usePersonalPins';
export { useCommunityPins, registerShareAdapter, sharePin, unsharePin, toSharedCopy, type ShareAdapter } from './community';
export { PIN_ART_KEYS, type PinArtKey } from './engine.generated';
export { PinArt, PinArtByKey } from './PinArt';
