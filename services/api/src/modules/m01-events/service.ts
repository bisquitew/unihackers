import { MicroEvent, CreateEventInput, RSVPInput, RSVPRecord } from './types';
import { seedEvents } from './seed';

export class EventsService {
  private events: MicroEvent[] = [...seedEvents];
  private rsvps: RSVPRecord[] = [];

  async listEvents(filter?: {
    category?: string;
    neighbourhood?: string;
    ageGroup?: string;
    search?: string;
  }): Promise<MicroEvent[]> {
    let result = [...this.events];

    if (filter?.category && filter.category !== 'all') {
      result = result.filter((e) => e.category === filter.category);
    }
    if (filter?.neighbourhood && filter.neighbourhood !== 'all') {
      result = result.filter(
        (e) => e.neighbourhood.toLowerCase() === filter.neighbourhood?.toLowerCase()
      );
    }
    if (filter?.ageGroup && filter.ageGroup !== 'all') {
      result = result.filter((e) => e.ageGroup === filter.ageGroup || e.ageGroup === 'all');
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.locationName.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }

  async getEventById(id: string): Promise<MicroEvent | null> {
    return this.events.find((e) => e.id === id) || null;
  }

  async createEvent(input: CreateEventInput): Promise<MicroEvent> {
    const newEvent: MicroEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      title: input.title,
      description: input.description,
      category: input.category,
      locationName: input.locationName,
      address: input.address,
      neighbourhood: input.neighbourhood,
      latitude: input.latitude,
      longitude: input.longitude,
      dateTime: input.dateTime,
      ageGroup: input.ageGroup || 'all',
      organizerName: input.organizerName,
      organizerContact: input.organizerContact,
      attendeeCount: 1,
      isFree: input.isFree !== undefined ? input.isFree : true,
      priceAmount: input.priceAmount,
      imageUrl: input.imageUrl,
    };

    this.events.push(newEvent);
    return newEvent;
  }

  async rsvp(input: RSVPInput): Promise<RSVPRecord> {
    const event = this.events.find((e) => e.id === input.eventId);
    if (!event) throw new Error('Event not found');

    event.attendeeCount += 1;

    // Generate simulated/real Solana ticket signature
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let sig = '';
    for (let i = 0; i < 88; i++) {
      sig += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const rsvpRecord: RSVPRecord = {
      id: `rsvp-${Date.now().toString(36)}`,
      eventId: input.eventId,
      userId: input.userId,
      userName: input.userName,
      userWallet: input.userWallet,
      solanaTicketSignature: sig,
      solanaExplorerUrl: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
      lookingForBuddy: Boolean(input.lookingForBuddy),
      createdAt: new Date().toISOString(),
    };

    this.rsvps.push(rsvpRecord);
    return rsvpRecord;
  }

  async getEventRSVPs(eventId: string): Promise<RSVPRecord[]> {
    return this.rsvps.filter((r) => r.eventId === eventId);
  }
}

export const eventsService = new EventsService();
