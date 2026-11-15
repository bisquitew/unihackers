import type { Outage } from '../modules/utilities.ts';

/**
 * Seed times are relative to when the API starts, so these demo outages are never "active" with a restore time in
 * the past (they used to be fixed to 13–15 Nov). Only used when the database is not connected; with Tiger Cloud the
 * outages come from m04_utilities_outages.
 */
const hoursFromNow = (h: number) => new Date(Math.round((Date.now() + h * 3600_000) / 600_000) * 600_000).toISOString().replace('.000Z', 'Z');

export const UTILITIES_SEED_DATA: Outage[] = [
  {
    id: 'e0123456-789a-bcde-f012-3456789abcde',
    provider: 'colterm',
    type: 'heating_and_hot_water',
    status: 'unplanned_breakdown',
    severity: 'critical',
    title: 'Avarie Rețea Primară Colterm - Complex Studențesc & Circumvalațiunii',
    description: 'Întrerupere furnizare încălzire și apă caldă de consum din cauza unei spărturi pe magistrala principală de termoficare. Echipele de intervenție sunt în teren.',
    affected_areas: ['Circumvalatiunii', 'Complex Studentesc'],
    affected_streets: [
      'Strada Gheorghe Lazăr',
      'Bulevardul Cetății',
      'Strada Circumvalațiunii',
      'Aleea Studenților'
    ],
    start_time: hoursFromNow(-6),
    estimated_restore_time: hoursFromNow(8),
    resolved_at: null,
    source_url: 'https://www.colterm.ro/stiri-comunicate',
    crowd_confirmations_count: 73,
    created_at: hoursFromNow(-5.75),
    updated_at: hoursFromNow(-1.5)
  },
  {
    id: 'f1234567-89ab-cdef-0123-456789abcdef',
    provider: 'aquatim',
    type: 'cold_water',
    status: 'scheduled_maintenance',
    severity: 'medium',
    title: 'Lucrări Programate Aquatim - Spălare Rețea în Zona Elisabetin & Bălcescu',
    description: 'Se întrerupe furnizarea apei potabile pentru lucrări de mentenanță și spălare a rezervoarelor de înmagazinare.',
    affected_areas: ['Elisabetin', 'Iosefin'],
    affected_streets: [
      'Piața Nicolae Bălcescu',
      'Strada Romulus',
      'Strada Odobescu'
    ],
    start_time: hoursFromNow(-2),
    estimated_restore_time: hoursFromNow(5),
    resolved_at: null,
    source_url: 'https://www.aquatim.ro/opriri-de-apa',
    crowd_confirmations_count: 14,
    created_at: hoursFromNow(-24),
    updated_at: hoursFromNow(-24)
  },
  {
    id: 'a2345678-9abc-def0-1234-56789abcdef0',
    provider: 'retele_electrice_banat',
    type: 'electricity',
    status: 'scheduled_maintenance',
    severity: 'low',
    title: 'Modernizare Post Trafo - Str. Simion Bărnuțiu',
    description: 'Lucrări de toaletare vegetație și modernizare transformator electric.',
    affected_areas: ['Fabric'],
    affected_streets: ['Calea Dorobanților', 'Strada Simion Bărnuțiu'],
    start_time: hoursFromNow(20),
    estimated_restore_time: hoursFromNow(24),
    resolved_at: null,
    source_url: 'https://www.e-distributie.com',
    crowd_confirmations_count: 5,
    created_at: hoursFromNow(-22),
    updated_at: hoursFromNow(-22)
  }
];
