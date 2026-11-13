import { BuddyRequest, CreateBuddyRequestInput, BuddyGroupChat, BuddyChatMessage } from './types';
import { seedBuddyRequests, seedGroupChats } from './seed';

export class BuddyService {
  private requests: BuddyRequest[] = [...seedBuddyRequests];
  private chats: BuddyGroupChat[] = [...seedGroupChats];

  async listRequests(eventId?: string): Promise<BuddyRequest[]> {
    if (eventId) {
      return this.requests.filter((r) => r.eventId === eventId && r.status === 'open');
    }
    return this.requests.filter((r) => r.status === 'open');
  }

  async createRequest(input: CreateBuddyRequestInput): Promise<BuddyRequest> {
    const newRequest: BuddyRequest = {
      id: `bud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      userId: input.userId || `usr-${Date.now()}`,
      userName: input.userName,
      bio: input.bio,
      university: input.university || 'Student / Resident',
      interests: input.interests || [],
      icebreakerPrompt: input.icebreakerPrompt || "What are you most excited to see or do?",
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    this.requests.unshift(newRequest);
    return newRequest;
  }

  async findMatches(eventId: string, userInterests: string[]): Promise<BuddyRequest[]> {
    const eventRequests = this.requests.filter((r) => r.eventId === eventId && r.status === 'open');
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

  async getChat(chatId: string): Promise<BuddyGroupChat | null> {
    return this.chats.find((c) => c.id === chatId) || null;
  }

  async getChatsForEvent(eventId: string): Promise<BuddyGroupChat[]> {
    return this.chats.filter((c) => c.eventId === eventId);
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    content: string
  ): Promise<BuddyChatMessage | null> {
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
