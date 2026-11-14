// Buddy requests shared by the Buddy finder screen and the per-event buddy sheet, so a request posted in one shows in the other.
export interface BuddyListing {
  id: string;
  eventId: string;
  eventTitle: string;
  userName: string;
  university: string;
  bio: string;
  interests: string[];
  icebreakerPrompt: string;
  matchScore?: number;
}

const SEED: BuddyListing[] = [
  {
    id: 'bud-001',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    userName: 'Lucas Weber',
    university: 'Erasmus UPT Electro',
    bio: 'Erasmus student from Munich studying Computer Science. Big fan of European cinema and craft beer.',
    interests: ['cinema', 'photography', 'craft beer', 'coffee'],
    icebreakerPrompt: 'Favorite A24 or European arthouse movie?',
    matchScore: 95,
  },
  {
    id: 'bud-002',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    userName: 'Ioana Moldovan',
    university: 'Architecture UPT',
    bio: 'Architecture student at Faculty of Architecture Timișoara. Love discussing ideas after film screenings!',
    interests: ['cinema', 'architecture', 'drawing', 'tea'],
    icebreakerPrompt: 'Shall we meet 20 minutes before to grab good seats?',
    matchScore: 88,
  },
  {
    id: 'bud-003',
    eventId: 'evt-002',
    eventTitle: 'Beginner Pottery & Clay Jam',
    userName: 'Sarah Jenkins',
    university: 'Alumni / Professional',
    bio: 'Newcomer in Timișoara working remotely in tech. Looking to meet creative people and learn pottery.',
    interests: ['pottery', 'crafts', 'hiking', 'languages'],
    icebreakerPrompt: 'Have you ever tried making a ceramic mug?',
    matchScore: 78,
  },
  {
    id: 'bud-004',
    eventId: 'evt-003',
    eventTitle: 'Sunset Acoustic & Jazz Session',
    userName: 'Radu Ionescu',
    university: 'UVT Music & Arts',
    bio: 'Guitar player and indie enthusiast. Want to sit on the Bega deck and listen to live sets together.',
    interests: ['jazz', 'acoustic', 'music', 'bega'],
    icebreakerPrompt: 'What’s your favorite local live music venue in Timișoara?',
    matchScore: 92,
  },
];

class BuddyStore {
  private items: BuddyListing[] = SEED;
  private listeners = new Set<() => void>();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  list(): BuddyListing[] {
    return [...this.items];
  }
  forEvent(eventId: string): BuddyListing[] {
    return this.items.filter((b) => b.eventId === eventId);
  }
  add(input: { eventId: string; eventTitle: string; userName: string; bio: string; interests: string[] }): BuddyListing {
    const created: BuddyListing = {
      id: `bud-${Date.now().toString(36)}`,
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      userName: input.userName.trim(),
      university: 'Resident / Student',
      bio: input.bio.trim() || 'Looking for good company for this event.',
      interests: input.interests.length ? input.interests : ['culture', 'events'],
      icebreakerPrompt: 'Shall we meet at the entrance?',
      matchScore: 90,
    };
    this.items = [created, ...this.items];
    this.listeners.forEach((fn) => fn());
    return created;
  }
}

export const buddyStore = new BuddyStore();
