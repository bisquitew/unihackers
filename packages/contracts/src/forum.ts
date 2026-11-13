export type ForumCategory =
  | 'lost_pets'
  | 'neighbourhood'
  | 'help'
  | 'buy_sell'
  | 'cultural';

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  category: ForumCategory;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  neighbourhood: string; // e.g. "Fabric", "Iosefin", "Complexul Studențesc", "Circumvalațiunii"
  photos: string[];
  upvotes: number;
  commentsCount: number;
  comments?: ForumComment[];
  isReported: boolean;
  reportCount: number;
  reportReason?: string;
  createdAt: string;
}

export interface CreatePostPayload {
  category: ForumCategory;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  neighbourhood: string;
  photos?: string[];
}

export interface ReportPostPayload {
  postId: string;
  reportedBy: string;
  reason: 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'other';
  note?: string;
}
