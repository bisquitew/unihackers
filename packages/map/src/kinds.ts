import type { PinArtKey } from './engine.generated';
import type { Coordinate, PinKind, PinVisibility } from './types';

/**
 * The pin-kind registry: one place that says what each kind of pin looks like and who may see it.
 * - 'private-only': never shared (home, work, ...). The share option is not even offered.
 * - 'choice': the owner picks private or public (safety concerns, lost & found, ...).
 * - 'public-only': contributed by an official module; not created by users.
 */
export type VisibilityPolicy = 'private-only' | 'choice' | 'public-only';

export interface PinKindDef {
  id: PinKind;
  label: string;
  /** illustration key (see PIN_ART_KEYS) */
  art: PinArtKey;
  policy: VisibilityPolicy;
  defaultVisibility: PinVisibility;
  /** can a resident create this kind from the map? */
  userCreatable: boolean;
  /** when shared, coordinates are snapped to a grid of this size so exact spots are not exposed */
  sharePrecisionMeters?: number;
  /** one line shown when choosing the kind */
  description: string;
  /** the module that will receive shared pins (for the team; not shown to users) */
  ownerModule?: string;
}

export const pinKinds: Record<PinKind, PinKindDef> = {
  home: { id: 'home', label: 'Home', art: 'home', policy: 'private-only', defaultVisibility: 'private', userCreatable: true, description: 'Only you see this.' },
  work: { id: 'work', label: 'Work or study', art: 'work', policy: 'private-only', defaultVisibility: 'private', userCreatable: true, description: 'Only you see this.' },
  favourite: { id: 'favourite', label: 'Favourite', art: 'feedback', policy: 'private-only', defaultVisibility: 'private', userCreatable: true, description: 'A place you like. Only you see this.' },
  note: { id: 'note', label: 'Note', art: 'note', policy: 'private-only', defaultVisibility: 'private', userCreatable: true, description: 'A reminder for yourself.' },
  safety: { id: 'safety', label: 'Safety concern', art: 'safety', policy: 'choice', defaultVisibility: 'public', userCreatable: true, sharePrecisionMeters: 50, description: 'A dark street or something unsafe. Sharing helps neighbours.', ownerModule: 'm03-safety' },
  lostFound: { id: 'lostFound', label: 'Lost or found', art: 'lostFound', policy: 'choice', defaultVisibility: 'public', userCreatable: true, sharePrecisionMeters: 30, description: 'A lost pet or a found item.', ownerModule: 'm08-forum' },
  smell: { id: 'smell', label: 'Smell report', art: 'smell', policy: 'choice', defaultVisibility: 'public', userCreatable: true, sharePrecisionMeters: 100, description: 'A smell you noticed here.', ownerModule: 'm06-smell' },
  meetup: { id: 'meetup', label: 'Meet-up spot', art: 'buddy', policy: 'choice', defaultVisibility: 'private', userCreatable: true, description: 'A place to meet people.', ownerModule: 'm07-buddy' },
  alert: { id: 'alert', label: 'City alert', art: 'utilities', policy: 'public-only', defaultVisibility: 'public', userCreatable: false, description: 'From the city.' },
  event: { id: 'event', label: 'Event', art: 'events', policy: 'public-only', defaultVisibility: 'public', userCreatable: false, description: 'An event.' },
  parking: { id: 'parking', label: 'Parking', art: 'parkie', policy: 'public-only', defaultVisibility: 'public', userCreatable: false, description: 'A parking lot.' },
  transit: { id: 'transit', label: 'Transit', art: 'transit', policy: 'public-only', defaultVisibility: 'public', userCreatable: false, description: 'A stop or detour.' },
};

export const userCreatableKinds: PinKindDef[] = Object.values(pinKinds).filter((k) => k.userCreatable);

/** Which visibilities may the user choose for this kind? One entry means there is no choice to show. */
export function allowedVisibilities(kind: PinKind): PinVisibility[] {
  const p = pinKinds[kind].policy;
  return p === 'private-only' ? ['private'] : p === 'public-only' ? ['public'] : ['private', 'public'];
}

/** Clamp a requested visibility to what the kind allows. This is the rule that keeps Home and Work from ever being shared. */
export function effectiveVisibility(kind: PinKind, requested?: PinVisibility): PinVisibility {
  const allowed = allowedVisibilities(kind);
  const wanted = requested ?? pinKinds[kind].defaultVisibility;
  return allowed.includes(wanted) ? wanted : allowed[0];
}

/** Snap a coordinate to a grid of `meters` so a shared pin does not reveal an exact spot. */
export function roundForSharing(c: Coordinate, meters: number): Coordinate {
  const latStep = meters / 111_320;
  const lngStep = meters / (111_320 * Math.cos((c.latitude * Math.PI) / 180));
  return {
    latitude: Math.round(c.latitude / latStep) * latStep,
    longitude: Math.round(c.longitude / lngStep) * lngStep,
  };
}
