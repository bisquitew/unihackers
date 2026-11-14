// The city the site is showing. Everything that names the city or centres the map reads it from here, so the site can
// adapt to another city by changing this (later: chosen from the visitor's location or a picker). Same shape as packages/map/src/city.ts.
export const CITY = {
  id: 'timisoara',
  name: 'Timișoara',
  center: { latitude: 45.7537, longitude: 21.2272 },
  zoom: 15.4,
  overviewZoom: 12.9,
  bounds: [[20.9, 45.55], [21.55, 45.95]],
};
