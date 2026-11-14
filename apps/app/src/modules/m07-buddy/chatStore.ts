// Conversations with buddies. One chat per person, kept here so it can be reopened from the Chats list, from a buddy's
// profile or from an event. Replies are simulated until a real chat service is connected.
import type { BuddyListing } from './buddyStore';

export interface ChatMessage {
  id: string;
  from: 'me' | 'other';
  author?: string;
  text: string;
  at: number;
}

export interface Conversation {
  id: string; // the buddy's id
  buddy: BuddyListing;
  messages: ChatMessage[];
  updatedAt: number;
  unread: number;
}

const REPLIES = [
  'Awesome! See you at the entrance 15 minutes before.',
  'Sounds good! Look for me near the outdoor terrace. I will text you when I arrive.',
  'Perfect, looking forward to meeting up! I have my ticket too.',
  'Haha yes! Let me check and get back to you in a minute.',
];

class ChatStore {
  private chats = new Map<string, Conversation>();
  private listeners = new Set<() => void>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private version = 0;

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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

  /** Opens the chat with this person, starting it (with their opening lines) the first time. */
  open(buddy: BuddyListing): Conversation {
    let chat = this.chats.get(buddy.id);
    if (!chat) {
      const now = Date.now();
      chat = {
        id: buddy.id,
        buddy,
        updatedAt: now,
        unread: 0,
        messages: [
          { id: `${buddy.id}-o1`, from: 'other', author: buddy.userName, text: `Hey! Glad you reached out about ${buddy.eventTitle}.`, at: now - 2000 },
          { id: `${buddy.id}-o2`, from: 'other', author: buddy.userName, text: buddy.icebreakerPrompt, at: now - 1000 },
        ],
      };
      this.chats.set(buddy.id, chat);
      this.emit();
    }
    return chat;
  }

  markRead(id: string) {
    const chat = this.chats.get(id);
    if (!chat || chat.unread === 0) return;
    this.chats.set(id, { ...chat, unread: 0 });
    this.emit();
  }

  /** Sends a message; the other person answers after a moment. `isOpen` tells whether the chat is on screen (else it counts as unread). */
  send(id: string, text: string, isOpen: () => boolean) {
    const chat = this.chats.get(id);
    const value = text.trim();
    if (!chat || !value) return;
    const now = Date.now();
    this.chats.set(id, { ...chat, updatedAt: now, messages: [...chat.messages, { id: `m-${now}`, from: 'me', text: value, at: now }] });
    this.emit();
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      const current = this.chats.get(id);
      if (!current) return;
      const at = Date.now();
      const reply: ChatMessage = { id: `r-${at}`, from: 'other', author: current.buddy.userName, text: REPLIES[Math.floor(Math.random() * REPLIES.length)], at };
      this.chats.set(id, { ...current, updatedAt: at, unread: isOpen() ? 0 : current.unread + 1, messages: [...current.messages, reply] });
      this.emit();
    }, 1100);
    this.timers.add(timer);
  }
}

export const chatStore = new ChatStore();

export function formatChatTime(at: number): string {
  const d = new Date(at);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
