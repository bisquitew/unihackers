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
    icebreakerPrompt: row.icebreaker_prompt || row.icebreakerPrompt || "What are you most looking forward to at this event?",
    status: row.status || 'open',
    createdAt: new Date(row.created_at || row.createdAt).toISOString(),
  };
}

// Chats are kept in m07_buddy_chats (one row per chat, messages included) and loaded once, so they survive a restart.
const CHATS_SCHEMA = `CREATE TABLE IF NOT EXISTS m07_buddy_chats (
  id VARCHAR(128) PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;

export class BuddyService {
  private chatsLoaded: Promise<void> | null = null;

  private loadChats(): Promise<void> {
    this.chatsLoaded ??= (async () => {
      if (!db.isTigerConnected()) return;
      try {
        await db.query(CHATS_SCHEMA);
        const rows = await db.query<any>(`SELECT data FROM m07_buddy_chats`);
        for (const r of rows) if (!this.chats.some((c) => c.id === r.data.id)) this.chats.push(r.data);
      } catch (err: any) {
        console.warn('[m07-buddy] could not load chats:', err.message);
      }
    })();
    return this.chatsLoaded;
  }

  /** saves run one after another per chat, and each writes the chat as it is when its turn comes */
  private saving = new Map<string, Promise<void>>();

  private saveChat(chat: BuddyGroupChat) {
    if (!db.isTigerConnected()) return;
    const prev = this.saving.get(chat.id) ?? Promise.resolve();
    const next = prev.then(() =>
      db.query(`INSERT INTO m07_buddy_chats (id, data, updated_at) VALUES ($1, $2, NOW())
                ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`, [chat.id, JSON.stringify(chat)])
        .then(() => {})
        .catch((err: any) => console.warn('[m07-buddy] could not save chat:', err.message)));
    this.saving.set(chat.id, next);
  }

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
      // the database needs a title; a request sent without one still goes through
      eventTitle: String(input.eventTitle || '').trim().slice(0, 140) || 'An event',
      userId: input.userId || `usr-${Date.now()}`,
      userName: input.userName,
      bio: input.bio,
      university: input.university || 'Student / Resident',
      interests: input.interests || [],
      icebreakerPrompt: input.icebreakerPrompt || "What are you most looking forward to at this event?",
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
    await this.loadChats();
    let chat = this.chats.find((c) => c.eventId === eventId);
    if (chat) {
      // whoever opens an existing chat joins it (participantIds[0] is the signed-in person)
      const [me, myName] = [participantIds[0], participantNames[0]];
      if (me && !chat.participantIds.includes(me)) {
        chat.participantIds.push(me);
        chat.participantNames.push(myName ?? 'Resident');
        this.saveChat(chat);
      }
    }
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
      this.saveChat(chat);
    }
    return chat;
  }

  /** The chats a person takes part in, most recent first. */
  async getChatsFor(sub: string): Promise<BuddyGroupChat[]> {
    await this.loadChats();
    const last = (c: BuddyGroupChat) => c.messages[c.messages.length - 1]?.sentAt ?? c.createdAt;
    return this.chats.filter((c) => c.participantIds.includes(sub)).sort((a, b) => last(b).localeCompare(last(a)));
  }

  async getChatsForEvent(eventId: string): Promise<BuddyGroupChat[]> {
    await this.loadChats();
    return this.chats.filter((c) => c.eventId === eventId);
  }

  async getChat(chatId: string): Promise<BuddyGroupChat | null> {
    await this.loadChats();
    return this.chats.find((c) => c.id === chatId) || null;
  }

  async sendMessage(chatId: string, senderId: string, senderName: string, content: string): Promise<BuddyChatMessage | null> {
    const chat = this.chats.find((c) => c.id === chatId);
    if (!chat) return null;

    const message: BuddyChatMessage = {
      id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      chatId,
      senderId,
      senderName,
      content,
      sentAt: new Date().toISOString(),
    };

    chat.messages.push(message);
    this.saveChat(chat);
    return message;
  }
}

export const buddyService = new BuddyService();
