import type { BuddyRequest, CreateBuddyRequestInput, BuddyGroupChat, BuddyChatMessage } from './types.ts';
import { seedBuddyRequests, seedGroupChats } from './seed.ts';
import { db } from '../../core/db.ts';

function rowToBuddy(row: any): BuddyRequest {
  return {
    id: row.id,
    eventId: row.event_id || row.eventId,
    eventTitle: row.event_title || row.eventTitle,
    userId: row.user_id || row.userId,
    userName: row.user_name || row.userName,
    bio: row.bio || '',
    university: row.university || 'Resident Timișoara',
    interests: Array.isArray(row.interests) ? row.interests : [],
    icebreakerPrompt: row.icebreaker_prompt || row.icebreakerPrompt || "Ce te entuziasmează la acest eveniment?",
    status: row.status || 'open',
    createdAt: new Date(row.created_at || row.createdAt).toISOString(),
  };
}

export class BuddyService {
  private requests: BuddyRequest[] = [...seedBuddyRequests];
  private chats: BuddyGroupChat[] = [...seedGroupChats];

  async listRequests(eventId?: string): Promise<BuddyRequest[]> {
    if (db.isTigerConnected()) {
      try {
        const sql = eventId
          ? `SELECT id, event_id, event_title, user_id, user_name, bio, university, interests, icebreaker_prompt, status, created_at FROM m07_buddy_requests WHERE status = 'open' AND event_id = $1 ORDER BY created_at DESC;`
          : `SELECT id, event_id, event_title, user_id, user_name, bio, university, interests, icebreaker_prompt, status, created_at FROM m07_buddy_requests WHERE status = 'open' ORDER BY created_at DESC;`;
        const params = eventId ? [eventId] : [];
        const rows = await db.query<any>(sql, params);
        if (rows && rows.length > 0) {
          return rows.map(rowToBuddy);
        }
      } catch (err: any) {
        console.warn('BuddyService TimescaleDB fallback:', err.message);
      }
    }

    if (eventId) {
      return this.requests.filter((r) => r.eventId === eventId && r.status === 'open');
    }
    return this.requests.filter((r) => r.status === 'open');
  }

  async createRequest(input: CreateBuddyRequestInput): Promise<BuddyRequest> {
    const id = `bud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const newRequest: BuddyRequest = {
      id,
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      userId: input.userId || `usr-${Date.now()}`,
      userName: input.userName,
      bio: input.bio,
      university: input.university || 'Student / Resident',
      interests: input.interests || [],
      icebreakerPrompt: input.icebreakerPrompt || "Ce te entuziasmează la acest eveniment?",
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    if (db.isTigerConnected()) {
      try {
        await db.query(`
          INSERT INTO m07_buddy_requests (
            id, event_id, event_title, user_id, user_name, bio,
            university, interests, icebreaker_prompt, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', NOW());
        `, [
          id, newRequest.eventId, newRequest.eventTitle, newRequest.userId,
          newRequest.userName, newRequest.bio, newRequest.university,
          newRequest.interests, newRequest.icebreakerPrompt
        ]);
      } catch (err: any) {
        console.warn('BuddyService createRequest TimescaleDB error:', err.message);
      }
    }

    this.requests.unshift(newRequest);
    return newRequest;
  }

  async findMatches(eventId: string, userInterests: string[]): Promise<BuddyRequest[]> {
    const eventRequests = await this.listRequests(eventId);
    if (!userInterests.length) return eventRequests;

    // Score based on shared interests
    return eventRequests
      .map((r) => {
        const shared = r.interests.filter((i) =>
          userInterests.some((ui) => ui.toLowerCase() === i.toLowerCase())
        );
        return { req: r, score: shared.length };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.req);
  }

  async getOrCreateChat(eventId: string, eventTitle: string, participantIds: string[], participantNames: string[]): Promise<BuddyGroupChat> {
    let chat = this.chats.find((c) => c.eventId === eventId);
    if (!chat) {
      chat = {
        id: `chat-${Date.now().toString(36)}`,
        eventId,
        eventTitle,
        participantIds,
        participantNames,
        messages: [],
        createdAt: new Date().toISOString()
      };
      this.chats.push(chat);
    }
    return chat;
  }

  async getChatsForEvent(eventId: string): Promise<BuddyGroupChat[]> {
    return this.chats.filter((c) => c.eventId === eventId);
  }

  async getChat(chatId: string): Promise<BuddyGroupChat | null> {
    return this.chats.find((c) => c.id === chatId) || null;
  }

  async sendMessage(chatId: string, senderId: string, senderName: string, content: string): Promise<BuddyChatMessage | null> {
    const chat = this.chats.find((c) => c.id === chatId);
    if (!chat) return null;

    const message: BuddyChatMessage = {
      id: `msg-${Date.now().toString(36)}`,
      chatId,
      senderId,
      senderName,
      content,
      sentAt: new Date().toISOString(),
    };

    chat.messages.push(message);
    return message;
  }
}

export const buddyService = new BuddyService();
