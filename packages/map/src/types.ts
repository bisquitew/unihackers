// Public types of @hub/map. Modules and screens talk to the map only through these.

export type PinVisibility = 'private' | 'public';
/** who the pin belongs to: the signed-in user, other residents, or an official module (alerts, events, ...). */
export type PinOwner = 'me' | 'community' | 'official';

export type PinKind =
  // personal, never shared
  | 'home'
  | 'work'
  | 'favourite'
  | 'note'
  // personal, can be shared with the community (policy per kind, see kinds.ts)
  | 'safety'
  | 'lostFound'
  | 'smell'
  | 'meetup'
  // contributed by modules through layers
  | 'alert'
  | 'event'
  | 'parking'
  | 'transit';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MapPin {
  id: string;
  kind: PinKind;
  /** which layer the pin belongs to, e.g. 'mine', 'alerts', 'community' */
  layerId: string;
  coordinate: Coordinate;
  title: string;
  subtitle?: string;
  visibility: PinVisibility;
  owner: PinOwner;
  /** where tapping "Open" leads, e.g. '/alerts/hot-water-garii-2'. Any expo-router path. */
  href?: string;
  createdAt: string;
  /** sample data that is not real yet; the UI labels it */
  demo?: boolean;
  /** actual geographic visual radius drawn around the pin in meters (e.g. 650m danger zone) */
  radiusMeters?: number;
  /** type of zone to color appropriately: 'danger' (red) or 'construction' (amber) */
  zoneType?: 'danger' | 'construction' | string;
}

/** A named group of pins that can be switched on and off. Modules contribute layers through `ModuleManifest.mapLayer`. */
export interface MapLayer {
  id: string;
  title: string;
  /** which module it comes from, for ownership and feature flags */
  moduleId?: string;
  pins: MapPin[];
  defaultVisible?: boolean;
}

/** 'flat' is the bright 2D map in the hop palette (default); 'city3d' is the tilted 3D city. */
export type MapSkin = 'flat' | 'city3d';
export type MapTheme = 'auto' | 'day' | 'golden' | 'night';

export interface MapInsets {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/** Where to move the camera. Change `nonce` to move to the same place again. */
export interface MapFocus {
  latitude: number;
  longitude: number;
  zoom?: number;
  nonce?: number;
}
