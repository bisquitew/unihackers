import type { MicroEvent } from './types.ts';

/**
 * Seed dates are relative to when the API starts, so the demo events are always upcoming (they used to be fixed to
 * 13–15 Nov and were in the past by demo time). `days` from today at a UTC time; a time already passed today moves to tomorrow.
 * Only used when the database is not connected; with Tiger Cloud the events come from m01_events.
 */
function upcoming(days: number, utcTime: string): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  let iso = `${d.toISOString().slice(0, 10)}T${utcTime}:00Z`;
  if (Date.parse(iso) < Date.now()) iso = new Date(Date.parse(iso) + 24 * 3600 * 1000).toISOString().replace('.000Z', 'Z');
  return iso;
}

export const seedEvents: MicroEvent[] = [
  {
    id: 'evt-001',
    title: 'Underground Indie Cinema Night',
    description: 'Outdoor screening of Romanian independent short films followed by an open discussion with the filmmakers. Hot spiced cider and blankets available!',
    category: 'cinema',
    locationName: 'Faber Community Yard',
    address: 'Splaiul Peneș Curcanul 4-5, Timișoara',
    neighbourhood: 'Fabric',
    latitude: 45.7533,
    longitude: 21.2508,
    dateTime: upcoming(0, '19:30'),
    ageGroup: 'all',
    organizerName: 'Asociația FilmTM',
    organizerContact: 'contact@filmtm.ro',
    attendeeCount: 38,
    maxCapacity: 60,
    isFree: true,
    audioDigestUrl: '/static/audio/digest_evt_001.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80',
  },
  {
    id: 'evt-002',
    title: 'Beginner Pottery & Clay Jam',
    description: 'Casual pottery and clay shaping workshop designed for students and newcomers. No prior experience needed, all materials provided.',
    category: 'workshop',
    locationName: 'Scârț Loc Lejer',
    address: 'Strada Zoe 1, Timișoara',
    neighbourhood: 'Elisabetin',
    latitude: 45.7386,
    longitude: 21.2185,
    dateTime: upcoming(1, '15:00'),
    ageGroup: 'students',
    organizerName: 'Atelierul de Lut',
    attendeeCount: 16,
    maxCapacity: 20,
    isFree: false,
    priceAmount: 25, // 25 RON
    audioDigestUrl: '/static/audio/digest_evt_002.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80',
  },
  {
    id: 'evt-003',
    title: 'Sunset Acoustic & Jazz Session',
    description: 'Local student musicians playing acoustic indie and jazz standards right on the deck along the Bega canal.',
    category: 'music',
    locationName: 'D’arc pe Mal',
    address: 'Splaiul Tudor Vladimirescu, Timișoara',
    neighbourhood: 'Iosefin',
    latitude: 45.7485,
    longitude: 21.2140,
    dateTime: upcoming(1, '18:00'),
    ageGroup: 'all',
    organizerName: 'JazzTM Collective',
    attendeeCount: 45,
    maxCapacity: 80,
    isFree: true,
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&q=80',
  },
  {
    id: 'evt-004',
    title: 'New Media & Generative Art Showcase',
    description: 'Interactive generative projection mapping and sound design created by students from the Faculty of Arts & Design (UVT).',
    category: 'showcase',
    locationName: 'Kunsthalle Bega',
    address: 'Calea Circumvalațiunii 10, Timișoara',
    neighbourhood: 'Circumvalațiunii',
    latitude: 45.7610,
    longitude: 21.2215,
    dateTime: upcoming(2, '17:00'),
    ageGroup: 'all',
    organizerName: 'Arte Timișoara',
    attendeeCount: 22,
    maxCapacity: 50,
    isFree: true,
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
  }
];
