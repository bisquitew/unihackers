// Safe places: the places where a person can get help in Timișoara. Hospitals, police stations and fire stations.
//
// Source: OpenStreetMap (amenity=hospital, police, fire_station), read once for the city and picked by hand to the main places
// inside Timișoara: hospitals (a "main" hospital, with emergency care where OpenStreetMap says so), police stations and
// headquarters, and fire stations. Clinics, ID and records offices, village police posts and the border office are left out.
// The numbers stay valid until the city adds or moves a station; refresh by running the same query and picking again.
//
// Every one of them can be reached through the European emergency number 112 (free, 24 hours).
import { calculateDistanceMeters } from './areas.ts';

export type SafePlaceKind = 'hospital' | 'police' | 'fire';

export interface SafePlace {
  id: string;
  kind: SafePlaceKind;
  name: string;
  latitude: number;
  longitude: number;
  /** hospitals only: OpenStreetMap marks it as having an emergency department */
  emergency: boolean;
  street: string | null;
}

export const SAFE_PLACE_LABEL: Record<SafePlaceKind, string> = {
  hospital: 'Hospital',
  police: 'Police station',
  fire: 'Fire station',
};

export const EMERGENCY_NUMBER = '112';

export const safePlaces: SafePlace[] = [
  { id: 'hospital-01', kind: 'hospital', name: "Spitalul Clinic Județean de Urgență Pius Brînzeu", latitude: 45.73677, longitude: 21.24203, emergency: true, street: "Bulevardul Dr. Iosif Bulbucă (Liviu Rebreanu)" },
  { id: 'hospital-02', kind: 'hospital', name: "Spitalul Clinic de Urgență pentru Copii Louis Țurcanu", latitude: 45.75364, longitude: 21.2221, emergency: true, street: null },
  { id: 'hospital-03', kind: 'hospital', name: "Spitalul Municipal Clinicile Noi", latitude: 45.75947, longitude: 21.22656, emergency: true, street: null },
  { id: 'hospital-04', kind: 'hospital', name: "Spitalul Militar de Urgență Dr. Victor Popescu", latitude: 45.7569, longitude: 21.22546, emergency: true, street: "Strada Gheorghe Lazăr" },
  { id: 'hospital-05', kind: 'hospital', name: "Spitalul Clinic de Boli Infecțioase și Pneumoftiziologie Dr. Victor Babeș", latitude: 45.76809, longitude: 21.25912, emergency: true, street: "Strada Gheorghe Adam" },
  { id: 'hospital-06', kind: 'hospital', name: "Institutul de Boli Cardiovasculare", latitude: 45.76917, longitude: 21.25898, emergency: true, street: "Strada Gheorghe Adam" },
  { id: 'hospital-07', kind: 'hospital', name: "Spitalul Clinic Căi Ferate", latitude: 45.74933, longitude: 21.21849, emergency: false, street: "Splaiul Tudor Vladimirescu" },
  { id: 'hospital-08', kind: 'hospital', name: "Clinica Universitară de Obstetrică Ginecologie Bega", latitude: 45.7439, longitude: 21.22948, emergency: false, street: null },
  { id: 'hospital-09', kind: 'hospital', name: "Spitalul Medici's", latitude: 45.74046, longitude: 21.22373, emergency: false, street: null },
  { id: 'hospital-10', kind: 'hospital', name: "Spital Premiere", latitude: 45.77922, longitude: 21.2193, emergency: false, street: null },
  { id: 'police-01', kind: 'police', name: "Inspectoratul de Poliție al Județului Timiș", latitude: 45.75937, longitude: 21.24107, emergency: false, street: "Bulevardul Take Ionescu" },
  { id: 'police-02', kind: 'police', name: "Poliția Municipiului Timișoara", latitude: 45.75867, longitude: 21.24167, emergency: false, street: null },
  { id: 'police-03', kind: 'police', name: "Secția nr. 1 Poliție", latitude: 45.76716, longitude: 21.25677, emergency: false, street: null },
  { id: 'police-04', kind: 'police', name: "Secția 2 Poliție", latitude: 45.73403, longitude: 21.23632, emergency: false, street: "Strada Martir Ioan Stanciu" },
  { id: 'police-05', kind: 'police', name: "Secția 3 Poliție", latitude: 45.73309, longitude: 21.20844, emergency: false, street: "Calea Șagului" },
  { id: 'police-06', kind: 'police', name: "Secția 4 Poliție", latitude: 45.76465, longitude: 21.20732, emergency: false, street: "Piața Avram Iancu" },
  { id: 'police-07', kind: 'police', name: "Secția 5 Poliție", latitude: 45.78238, longitude: 21.22038, emergency: false, street: null },
  { id: 'police-08', kind: 'police', name: "Poliția Locală Timișoara", latitude: 45.77005, longitude: 21.25255, emergency: false, street: null },
  { id: 'police-09', kind: 'police', name: "Poliția Transporturi Timișoara", latitude: 45.7502, longitude: 21.20915, emergency: false, street: "Bulevardul Republicii" },
  { id: 'police-10', kind: 'police', name: "Inspectoratul Județean de Jandarmi Timiș", latitude: 45.74711, longitude: 21.19974, emergency: false, street: "Strada Gheorghe Barițiu" },
  { id: 'fire-01', kind: 'fire', name: "Pompierii Militari", latitude: 45.76346, longitude: 21.24375, emergency: false, street: "Strada Înfrățirii" },
  { id: 'fire-02', kind: 'fire', name: "Detașamentul 2 Pompieri", latitude: 45.74072, longitude: 21.2104, emergency: false, street: null },
  { id: 'fire-03', kind: 'fire', name: "Pompieri Fabric", latitude: 45.75447, longitude: 21.25262, emergency: false, street: null },
];

export interface SafePlaceNear extends SafePlace {
  distance_meters: number;
}

/** The safe places closest to a spot, nearest first. `kind` limits it to one sort of place. */
export function nearestSafePlaces(lat: number, lng: number, opts: { kind?: SafePlaceKind; limit?: number; emergencyOnly?: boolean } = {}): SafePlaceNear[] {
  const limit = Math.max(1, Math.min(50, opts.limit ?? 3));
  return safePlaces
    .filter((p) => (!opts.kind || p.kind === opts.kind) && (!opts.emergencyOnly || p.kind !== 'hospital' || p.emergency))
    .map((p) => ({ ...p, distance_meters: Math.round(calculateDistanceMeters(lat, lng, p.latitude, p.longitude)) }))
    .sort((a, b) => a.distance_meters - b.distance_meters)
    .slice(0, limit);
}

/** What a person needs to know about a place, in one line. */
export function describeSafePlace(p: SafePlace): string {
  const what = p.kind === 'hospital' ? (p.emergency ? 'Hospital with emergency care' : 'Hospital') : SAFE_PLACE_LABEL[p.kind];
  return `${what}${p.street ? `, ${p.street}` : ''}. In an emergency call ${EMERGENCY_NUMBER}.`;
}
