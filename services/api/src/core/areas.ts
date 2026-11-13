import type { Area } from '@hub/contracts';

export const TIMISOARA_AREAS: Area[] = [
  { id: 'area-cetate', name: 'Cetate (Centru)', slug: 'cetate', center_lat: 45.7578, center_lng: 21.2290, radius_meters: 1200 },
  { id: 'area-circumvalatiunii', name: 'Circumvalațiunii', slug: 'circumvalatiunii', center_lat: 45.7620, center_lng: 21.2180, radius_meters: 1500 },
  { id: 'area-complex', name: 'Complex Studențesc', slug: 'complex-studentesc', center_lat: 45.7480, center_lng: 21.2410, radius_meters: 1300 },
  { id: 'area-iosefin', name: 'Iosefin', slug: 'iosefin', center_lat: 45.7450, center_lng: 21.2050, radius_meters: 1500 },
  { id: 'area-elisabetin', name: 'Elisabetin', slug: 'elisabetin', center_lat: 45.7420, center_lng: 21.2280, radius_meters: 1400 },
  { id: 'area-fabric', name: 'Fabric', slug: 'fabric', center_lat: 45.7580, center_lng: 21.2510, radius_meters: 1800 },
  { id: 'area-soarelui', name: 'Zona Soarelui', slug: 'soarelui', center_lat: 45.7380, center_lng: 21.2580, radius_meters: 1600 },
  { id: 'area-girocului', name: 'Calea Girocului', slug: 'girocului', center_lat: 45.7320, center_lng: 21.2350, radius_meters: 1600 },
  { id: 'area-dambovita', name: 'Dâmbovița', slug: 'dambovita', center_lat: 45.7350, center_lng: 21.1980, radius_meters: 1500 },
  { id: 'area-mehala', name: 'Mehala', slug: 'mehala', center_lat: 45.7680, center_lng: 21.2020, radius_meters: 1700 },
  { id: 'area-aradului', name: 'Calea Aradului', slug: 'aradului', center_lat: 45.7720, center_lng: 21.2260, radius_meters: 1800 },
  { id: 'area-lipovei', name: 'Calea Lipovei', slug: 'lipovei', center_lat: 45.7740, center_lng: 21.2420, radius_meters: 1800 },
  { id: 'area-gara', name: 'Gara de Nord', slug: 'gara-de-nord', center_lat: 45.7505, center_lng: 21.2081, radius_meters: 1000 }
];

export function getAreaBySlugOrName(query: string): Area | undefined {
  const q = query.toLowerCase().trim();
  return TIMISOARA_AREAS.find((a) => a.slug === q || a.name.toLowerCase().includes(q));
}

// Simple Haversine distance in meters
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function findMatchingArea(lat: number, lng: number): Area | undefined {
  let closest: Area | undefined = undefined;
  let minDistance = Infinity;

  for (const area of TIMISOARA_AREAS) {
    const dist = calculateDistanceMeters(lat, lng, area.center_lat, area.center_lng);
    if (dist <= area.radius_meters && dist < minDistance) {
      minDistance = dist;
      closest = area;
    }
  }

  return closest;
}
