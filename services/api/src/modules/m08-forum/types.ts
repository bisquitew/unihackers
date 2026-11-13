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
  neighbourhood: string;
  photos: string[];
  upvotes: number;
  commentsCount: number;
  comments: ForumComment[];
  isReported: boolean;
  reportCount: number;
  reportReasons?: string[];
  createdAt: string;
}

export interface CreatePostInput {
  category: ForumCategory;
  title: string;
  content: string;
  authorId?: string;
  authorName: string;
  neighbourhood: string;
  photos?: string[];
}

export interface ReportPostInput {
  postId: string;
  reason: 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'other';
  note?: string;
  reportedBy?: string;
}
