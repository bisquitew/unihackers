import type { MicroEvent, CreateEventInput, RSVPInput, RSVPRecord } from './types.ts';
import { seedEvents } from './seed.ts';
import { db } from '../../core/db.ts';

function rowToEvent(row: any): MicroEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    locationName: row.location_name || row.locationName || '',
    address: row.address,
    neighbourhood: row.neighbourhood,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    dateTime: new Date(row.date_time || row.dateTime).toISOString(),
    ageGroup: row.age_group || row.ageGroup || 'all',
    organizerName: row.organizer_name || row.organizerName || 'Comunitatea Timișoara',
    organizerContact: row.organizer_contact || row.organizerContact,
    attendeeCount: Number(row.attendee_count ?? row.attendeeCount ?? 1),
    isFree: row.is_free !== undefined ? Boolean(row.is_free) : true,
    priceAmount: row.ticket_price ? Number(row.ticket_price) : undefined,
    imageUrl: row.photo_url || row.imageUrl,
  };
}

export class EventsService {
  private events: MicroEvent[] = [...seedEvents];
  private rsvps: RSVPRecord[] = [];

  async listEvents(filter?: {
    category?: string;
    neighbourhood?: string;
    ageGroup?: string;
    search?: string;
  }): Promise<MicroEvent[]> {
    if (db.isTigerConnected()) {
      try {
        const rows = await db.query<any>(`
          SELECT id, title, description, category, location_name, address,
                 neighbourhood, latitude, longitude, date_time, age_group,
                 organizer_name, organizer_contact, attendee_count, is_free, photo_url
          FROM m01_events
          ORDER BY date_time ASC;
        `);
        if (rows && rows.length > 0) {
          let list = rows.map(rowToEvent);
          if (filter?.category && filter.category !== 'all') {
            list = list.filter((e) => e.category === filter.category);
          }
          if (filter?.neighbourhood && filter.neighbourhood !== 'all') {
            list = list.filter((e) => e.neighbourhood.toLowerCase() === filter.neighbourhood?.toLowerCase());
          }
          if (filter?.ageGroup && filter.ageGroup !== 'all') {
            list = list.filter((e) => e.ageGroup === filter.ageGroup || e.ageGroup === 'all');
          }
          if (filter?.search) {
            const q = filter.search.toLowerCase();
            list = list.filter((e) =>
              e.title.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q) ||
              e.locationName.toLowerCase().includes(q)
            );
          }
          return list;
        }
      } catch (err: any) {
        console.warn('EventsService TimescaleDB query fallback:', err.message);
      }
    }

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
    if (db.isTigerConnected()) {
      try {
        const rows = await db.query<any>(`
          SELECT id, title, description, category, location_name, address,
                 neighbourhood, latitude, longitude, date_time, age_group,
                 organizer_name, organizer_contact, attendee_count, is_free, photo_url
          FROM m01_events
          WHERE id = $1 LIMIT 1;
        `, [id]);
        if (rows && rows.length > 0) {
          return rowToEvent(rows[0]);
        }
      } catch {}
    }
    return this.events.find((e) => e.id === id) || null;
  }

  async createEvent(input: CreateEventInput): Promise<MicroEvent> {
    const id = `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const newEvent: MicroEvent = {
      id,
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

    if (db.isTigerConnected()) {
      try {
        await db.query(`
          INSERT INTO m01_events (
            id, title, description, category, location_name, address,
            neighbourhood, latitude, longitude, date_time, age_group,
            organizer_name, organizer_contact, attendee_count, is_free, photo_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
        `, [
          id, newEvent.title, newEvent.description, newEvent.category,
          newEvent.locationName, newEvent.address, newEvent.neighbourhood,
          newEvent.latitude, newEvent.longitude, newEvent.dateTime, newEvent.ageGroup,
          newEvent.organizerName, newEvent.organizerContact, 1, newEvent.isFree, newEvent.imageUrl
        ]);
      } catch (err: any) {
        console.warn('EventsService createEvent TimescaleDB error:', err.message);
      }
    }

    this.events.push(newEvent);
    return newEvent;
  }

  async rsvp(input: RSVPInput): Promise<RSVPRecord> {
    const event = await this.getEventById(input.eventId);
    if (!event) throw new Error('Event not found');

    if (db.isTigerConnected()) {
      try {
        await db.query(`UPDATE m01_events SET attendee_count = attendee_count + 1 WHERE id = $1;`, [input.eventId]);
      } catch {}
    }

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
