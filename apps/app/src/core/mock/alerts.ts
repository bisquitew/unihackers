// Temporary local data for the shell, shaped like P2's outage and detour models.
// Replace with @hub/api-client calls (GET /v1/m/utilities/outages, /v1/m/transit/detours) once the API is wired up.
import type { ModuleArtId } from '@hub/ui';

export type AlertStep = { state: 'done' | 'now' | 'next'; title: string; note?: string };

export type AlertItem = {
  id: string;
  /** where it happens; the map layer uses this */
  coordinate: { latitude: number; longitude: number };
  /** Which module the alert comes from; its illustration leads the row. Use each illustration once per screen. */
  module: ModuleArtId;
  group: 'places' | 'city';
  title: string;
  detail: string;
  trailing: { kind: 'new' } | { kind: 'time'; text: string };
  headline: string;
  context: string;
  steps: AlertStep[];
  confirmedBy: number;
};

export const alerts: AlertItem[] = [
  {
    id: 'danger-jiul',
    coordinate: { latitude: 45.7530, longitude: 21.2160 },
    module: 'safety',
    group: 'places',
    title: '🚨 Pericol Gaze: Pasajul Jiul (Rază 650m)',
    detail: 'Perimetru de siguranță. Vecini semnalați: Circumvalațiunii, Cetate.',
    trailing: { kind: 'new' },
    headline: 'Perimetru Critic de Siguranță — Rază 650 metri',
    context: 'Scurgere de gaze identificată la lucrările edilitare de la Pasajul Jiul. ISU Banat a instituit perimetrul de siguranță.',
    steps: [
      { state: 'done', title: 'Perimetru instituit de ISU', note: '17:30' },
      { state: 'now', title: 'Vecini semnalați prin push & GIS', note: 'Circumvalațiunii & Cetate' },
      { state: 'next', title: 'Remediere și redeschidere perimetru', note: 'Estimare 23:00' },
    ],
    confirmedBy: 48,
  },
  {
    id: 'const-bogdanestilor',
    coordinate: { latitude: 45.7665, longitude: 21.2050 },
    module: 'transit',
    group: 'places',
    title: '🚧 Șantier Calea Bogdăneștilor (Rază 900m)',
    detail: 'Reabilitare cale rulată STPT. Vecini semnalați: Mehala, Dâmbovița.',
    trailing: { kind: 'new' },
    headline: 'Zonă de Lucrări și Utilaje Grele — Rază 900 metri',
    context: 'Șantier activ de modernizare a liniei de tramvai. Trafic restricționat doar pentru riveranii din perimetru.',
    steps: [
      { state: 'done', title: 'Deschidere șantier și delimitare GIS', note: 'Noiembrie' },
      { state: 'now', title: 'Săpături și refacere fundație cale', note: 'Zilnic 08:00 - 17:00' },
      { state: 'next', title: 'Finalizare și repunere în circulație', note: 'Decembrie 2026' },
    ],
    confirmedBy: 34,
  },
  {
    id: 'hot-water-garii-2',
    coordinate: { latitude: 45.7499, longitude: 21.2083 },
    module: 'utilities',
    group: 'places',
    title: 'Hot water is off',
    detail: 'Strada Gării 2. Back about 18:00.',
    trailing: { kind: 'new' },
    headline: 'No hot water until about 18:00',
    context: 'Strada Gării 2. Colterm is repairing a pipe.',
    steps: [
      { state: 'done', title: 'Confirmed by Colterm', note: '15:05' },
      { state: 'now', title: 'Repair in progress', note: 'Crew on site' },
      { state: 'next', title: 'Hot water back', note: 'Expected about 18:00' },
    ],
    confirmedBy: 14,
  },
  {
    id: 'tram-5',
    coordinate: { latitude: 45.7488, longitude: 21.2244 },
    module: 'transit',
    group: 'places',
    title: 'Tram 5 isn’t running',
    detail: 'Take 5C instead.',
    trailing: { kind: 'time', text: 'Until Dec' },
    headline: 'Tram 5 isn’t running until December',
    context: 'Roadworks on Calea Bogdăneștilor. Take bus 5C from Piața Sfântul Gheorghe.',
    steps: [
      { state: 'done', title: 'Roadworks announced', note: 'August' },
      { state: 'now', title: 'Line 5 suspended', note: 'Bus 5C runs instead' },
      { state: 'next', title: 'Line 5 returns', note: 'Expected December' },
    ],
    confirmedBy: 6,
  },
  {
    id: 'smell-east',
    coordinate: { latitude: 45.763, longitude: 21.266 },
    module: 'smell',
    group: 'city',
    title: 'Burnt smell in the east',
    detail: '12 reports in the last hour.',
    trailing: { kind: 'time', text: '1h' },
    headline: 'Burnt smell reported in the east',
    context: '12 residents reported a burnt-rubber smell between 07:00 and 08:00.',
    steps: [
      { state: 'done', title: 'First report', note: '07:10' },
      { state: 'now', title: 'Reports coming in', note: '12 so far' },
      { state: 'next', title: 'Source unknown', note: 'No official notice yet' },
    ],
    confirmedBy: 12,
  },
  {
    id: 'lights-gara',
    coordinate: { latitude: 45.7505, longitude: 21.2071 },
    module: 'safety',
    group: 'city',
    title: 'Streetlights out',
    detail: 'Near Gara de Nord. 3 reports.',
    trailing: { kind: 'time', text: 'Today' },
    headline: 'Streetlights are out near Gara de Nord',
    context: 'Three residents reported dark stretches on Strada Gării.',
    steps: [
      { state: 'done', title: 'Reported', note: 'Today' },
      { state: 'now', title: 'Passed to public lighting', note: 'Awaiting a repair slot' },
      { state: 'next', title: 'Lights back on' },
    ],
    confirmedBy: 3,
  },
];

export const alertsFor = (group: AlertItem['group']) => alerts.filter((a) => a.group === group);
export const alertById = (id: string) => alerts.find((a) => a.id === id);

export const unreadAlerts = 2;
