// Conversations with buddies, kept on the server (/v1/m/buddy/chats): one chat per pair of people, private to them.
// The store mirrors them for the screens and checks for new messages every few seconds while a chat screen is open.
import { api, onSessionToken } from '../../core/api';
import type { BuddyListing } from './buddyStore';

export interface ChatMessage {
  id: string;
  from: 'me' | 'other';
  author?: string;
  text: string;
  at: number;
  /** true until the server has it */
  pending?: boolean;
}

export interface Conversation {
  id: string; // the buddy listing's id (or the other person's account when the chat came from them)
  buddy: BuddyListing;
  messages: ChatMessage[];
  updatedAt: number;
  unread: number;
}

interface ServerChat {
  id: string;
  eventId: string;
  eventTitle: string;
  participantIds: string[];
  participantNames: string[];
  messages: { id: string; senderId: string; senderName: string; content: string; sentAt: string }[];
  createdAt: string;
}

const POLL_MS = 4000;
const pairKey = (a: string, b: string) => `dm:${[a, b].sort().join(':')}`;

class ChatStore {
  private chats = new Map<string, Conversation>();
  /** conversation id -> the other person's account, and -> the server chat */
  private other = new Map<string, string>();
  private serverId = new Map<string, string>();
  /** messages already seen per conversation, for the unread count */
  private seen = new Map<string, number>();
  private me: string | null = null;
  private listeners = new Set<() => void>();
  private version = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    onSessionToken((token) => {
      if (token) void this.refresh();
      else {
        this.chats.clear();
        this.other.clear();
        this.serverId.clear();
        this.seen.clear();
        this.me = null;
        this.emit();
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    if (!this.timer) {
      void this.refresh();
      this.timer = setInterval(() => void this.refresh(), POLL_MS);
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  }
  /** Changes whenever anything changes, so a screen can re-read cheaply. */
  getVersion(): number {
    return this.version;
  }
  private emit() {
    this.version += 1;
    this.listeners.forEach((fn) => fn());
  }

  /** Every conversation, most recent first. */
  list(): Conversation[] {
    return [...this.chats.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  get(id: string): Conversation | undefined {
    return this.chats.get(id);
  }
  unreadTotal(): number {
    let n = 0;
    this.chats.forEach((c) => (n += c.unread));
    return n;
  }

  /** Reads my chats from the server and merges them in. */
  async refresh(): Promise<void> {
    let data: { chats: ServerChat[]; me: string };
    try {
      data = await api.get('/v1/m/buddy/chats/mine');
    } catch {
      return; // signed out or offline: keep what is shown
    }
    this.me = data.me;
    for (const sc of data.chats ?? []) {
      const i = sc.participantIds.findIndex((p) => p !== data.me);
      const otherId = sc.participantIds[i] ?? sc.participantIds[0];
      const otherName = sc.participantNames[i] ?? 'Neighbour';
      let id = [...this.other.entries()].find(([, o]) => o === otherId)?.[0];
      if (!id) {
        id = otherId;
        this.other.set(id, otherId);
      }
      this.serverId.set(id, sc.id);
      const prev = this.chats.get(id);
      const messages: ChatMessage[] = sc.messages.map((m) => ({
        id: m.id,
        from: m.senderId === data.me ? 'me' : 'other',
        author: m.senderName,
        text: m.content,
        at: new Date(m.sentAt).getTime(),
      }));
      const pending = (prev?.messages ?? []).filter((m) => m.pending && !messages.some((x) => x.from === 'me' && x.text === m.text));
      const all = [...messages, ...pending];
      const fromOther = messages.filter((m) => m.from === 'other').length;
      const seen = this.seen.get(id) ?? (prev ? fromOther : fromOther);
      if (!this.seen.has(id)) this.seen.set(id, seen);
      const buddy: BuddyListing = prev?.buddy ?? {
        id,
        userId: otherId,
        eventId: sc.eventId,
        eventTitle: sc.eventTitle,
        userName: otherName,
        university: 'Resident',
        bio: '',
        interests: [],
        icebreakerPrompt: '',
      };
      this.chats.set(id, {
        id,
        buddy,
        messages: all,
        updatedAt: all.length ? all[all.length - 1].at : new Date(sc.createdAt).getTime(),
        unread: Math.max(0, fromOther - seen),
      });
    }
    this.emit();
  }

  /** Opens the chat with this person, creating it on the server the first time. */
  open(buddy: BuddyListing): Conversation {
    let chat = this.chats.get(buddy.id);
    if (!chat) {
      chat = { id: buddy.id, buddy, updatedAt: Date.now(), unread: 0, messages: [] };
      this.chats.set(buddy.id, chat);
      if (buddy.userId) this.other.set(buddy.id, buddy.userId);
      this.emit();
    }
    void this.ensureServerChat(buddy.id);
    return chat;
  }

  private async ensureServerChat(id: string): Promise<string | null> {
    const existing = this.serverId.get(id);
    if (existing) return existing;
    const conv = this.chats.get(id);
    const otherId = this.other.get(id);
    if (!conv || !otherId) return null;
    if (!this.me) await this.refresh();
    if (!this.me) return null;
    try {
      const { chat } = await api.post<{ chat: ServerChat }>('/v1/m/buddy/chats', {
        eventId: pairKey(this.me, otherId),
        eventTitle: conv.buddy.eventTitle,
        participantIds: [otherId],
        participantNames: [conv.buddy.userName],
      });
      this.serverId.set(id, chat.id);
      return chat.id;
    } catch {
      return null;
    }
  }

  markRead(id: string) {
    const chat = this.chats.get(id);
    if (!chat) return;
    this.seen.set(id, chat.messages.filter((m) => m.from === 'other' && !m.pending).length);
    if (chat.unread === 0) return;
    this.chats.set(id, { ...chat, unread: 0 });
    this.emit();
  }

  /** Sends a message. It shows at once and is confirmed by the next refresh. */
  send(id: string, text: string, _isOpen?: () => boolean) {
    const chat = this.chats.get(id);
    const value = text.trim();
    if (!chat || !value) return;
    const now = Date.now();
    this.chats.set(id, { ...chat, updatedAt: now, messages: [...chat.messages, { id: `local-${now}`, from: 'me', text: value, at: now, pending: true }] });
    this.emit();
    void (async () => {
      const serverChat = await this.ensureServerChat(id);
      if (!serverChat) return;
      try {
        await api.post(`/v1/m/buddy/chats/${encodeURIComponent(serverChat)}/messages`, { content: value });
        await this.refresh();
      } catch {
        /* stays pending; the next send or refresh retries the view */
      }
    })();
  }

  /** True when this buddy can be messaged (their listing came from the server with an account). */
  canMessage(buddy: BuddyListing): boolean {
    return !!buddy.userId || this.serverId.has(buddy.id);
  }
}

export const chatStore = new ChatStore();

export function formatChatTime(at: number): string {
  const d = new Date(at);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
