import type { TransitLine, DetourAlert, TransitStop } from '../modules/transit.ts';

export const TRANSIT_DETOURS_SEED_DATA: DetourAlert[] = [
  {
    id: 'b3456789-abcd-ef01-2345-6789abcdef01',
    line_number: '5',
    title: 'Linia 5 Tramvai - Suspendată temporar pentru reabilitare carosabil',
    reason: 'Lucrări majore de modernizare a tramei stradale și a căii de rulare pe Calea Bogdăneștilor.',
    status: 'suspended',
    affected_stops: [
      'Calea Bogdăneștilor',
      'Balta Verde',
      'Bariera Ronaț',
      'Piața Timișoara 700'
    ],
    alternative_instructions: 'Folosiți linia temporară de autobuz 5C care circulă pe traseul Piața Sf. Gheorghe - Calea Bogdăneștilor - Ronaț.',
    replacement_line: '5C',
    valid_from: '2026-08-01T00:00:00Z',
    valid_until: '2026-12-31T23:59:59Z',
    created_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'c456789a-bcde-f012-3456-789abcdef012',
    line_number: '1',
    title: 'Linia 1 Tramvai - Traseu deviat prin Gara de Nord',
    reason: 'Reabilitare macaz și linie tramvai în zona Piața Mocioni / Bulevardul 16 Decembrie 1989.',
    status: 'detoured',
    affected_stops: [
      'Piața Mocioni',
      'Piața Sf. Maria'
    ],
    alternative_instructions: 'Tramvaiele liniei 1 circulă deviat via Bulevardul Dragalina - Gara de Nord - Bulevardul Dâmbovița.',
    replacement_line: null,
    valid_from: '2026-09-01T00:00:00Z',
    valid_until: '2026-12-31T23:59:59Z',
    created_at: '2026-09-01T00:00:00Z'
  },
  {
    id: 'd56789ab-cdef-0123-4567-89abcdef0123',
    line_number: '5C',
    title: 'Linia 5C Autobuz - Linie temporară de înlocuire tramvai 5',
    reason: 'Asigură legătura între centrul orașului și cartierul Ronaț pe perioada suspendării liniei 5 de tramvai.',
    status: 'temporary_replacement',
    affected_stops: [],
    alternative_instructions: 'Plecare la fiecare 12 minute din Piața Sf. Gheorghe către Ronaț.',
    replacement_line: null,
    valid_from: '2026-08-01T00:00:00Z',
    valid_until: '2026-12-31T23:59:59Z',
    created_at: '2026-08-01T00:00:00Z'
  }
];

export const TRANSIT_LINES_SEED_DATA: TransitLine[] = [
  {
    id: 'line-5',
    line_number: '5',
    type: 'tram',
    name: 'Linia 5 Tramvai (Piața Libertății - Calea Bogdăneștilor - Ronaț)',
    status: 'suspended',
    current_route_summary: 'SUSPENDATĂ. Înlocuită complet de autobuzul 5C.',
    detour_alert: TRANSIT_DETOURS_SEED_DATA[0]
  },
  {
    id: 'line-5c',
    line_number: '5C',
    type: 'bus',
    name: 'Linia 5C Autobuz Temporar (Piața Sf. Gheorghe - Ronaț)',
    status: 'temporary_replacement',
    current_route_summary: 'Activă. Preia fluxul de călători al liniei 5 tramvai.',
    detour_alert: TRANSIT_DETOURS_SEED_DATA[2]
  },
  {
    id: 'line-1',
    line_number: '1',
    type: 'tram',
    name: 'Linia 1 Tramvai (Gara de Nord - Meteo)',
    status: 'detoured',
    current_route_summary: 'Deviată prin Bulevardul Dâmbovița.',
    detour_alert: TRANSIT_DETOURS_SEED_DATA[1]
  },
  {
    id: 'line-2',
    line_number: '2',
    type: 'tram',
    name: 'Linia 2 Tramvai (City Mall - Piața 700 - Gara de Nord)',
    status: 'detoured',
    current_route_summary: 'Deviată parțial pentru evitarea lucrărilor din zona central-sudică.',
    detour_alert: null
  },
  {
    id: 'line-4',
    line_number: '4',
    type: 'tram',
    name: 'Linia 4 Tramvai (Torontalului - Ciarda Roșie)',
    status: 'normal',
    current_route_summary: 'Circulă conform orarului obișnuit pe tot traseul.',
    detour_alert: null
  }
];
