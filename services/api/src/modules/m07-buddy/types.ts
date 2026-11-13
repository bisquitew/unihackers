export type BuddyStatus = 'open' | 'matched' | 'closed';

export interface BuddyRequest {
  id: string;
  eventId: string;
  eventTitle?: string;
  userId: string;
  userName: string;
  bio?: string;
  university?: string;
  interests: string[];
  icebreakerPrompt: string;
  status: BuddyStatus;
  matchedWith?: string[];
  createdAt: string;
}

export interface CreateBuddyRequestInput {
  eventId: string;
  eventTitle?: string;
  userId?: string;
  userName: string;
  bio?: string;
  university?: string;
  interests: string[];
  icebreakerPrompt?: string;
}

export interface BuddyChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
}

export interface BuddyGroupChat {
  id: string;
  eventId: string;
  eventTitle: string;
  participantIds: string[];
  participantNames: string[];
  messages: BuddyChatMessage[];
  createdAt: string;
}
