// The city the app is showing. Everything that names the city or centres the map reads it from here, so the app
// can adapt to another city by changing this (later: chosen from the person's location or a picker).
export interface City {
  id: string;
  /** shown in sentences: "What's happening across {name}" */
  name: string;
  center: { latitude: number; longitude: number };
  /** the opening zoom, close enough to read streets */
  zoom: number;
  /** the map cannot be dragged outside this box: [[west, south], [east, north]] */
  bounds: [[number, number], [number, number]];
}

export const TIMISOARA: City = {
  id: 'timisoara',
  name: 'Timișoara',
  center: { latitude: 45.7537, longitude: 21.2272 },
  zoom: 15.4,
  bounds: [[20.9, 45.55], [21.55, 45.95]],
};

let current: City = TIMISOARA;
export const getCity = (): City => current;
export function setCity(city: City) {
  current = city;
}
