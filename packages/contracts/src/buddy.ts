export type BuddyStatus = 'open' | 'matched' | 'closed';

export interface BuddyRequest {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  bio?: string;
  university?: string; // e.g. "UVT", "UPT", "UMFT"
  interests: string[]; // e.g. ["indie film", "photography", "board games", "techno"]
  icebreakerPrompt: string; // e.g. "What's the best film you watched this year?"
  status: BuddyStatus;
  matchedWith?: string[]; // user IDs of matched buddies
  createdAt: string;
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
  participantIds: string[];
  participantNames: string[];
  messages: BuddyChatMessage[];
  createdAt: string;
}
