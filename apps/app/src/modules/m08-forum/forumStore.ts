// Shared Persistent Forum Store for [M08_FORUM]
// Supports browser localStorage persistence and background sync with backend API

export interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  category: 'lost_pets' | 'neighbourhood' | 'help' | 'buy_sell' | 'cultural';
  title: string;
  content: string;
  authorName: string;
  neighbourhood: string;
  photos: string[];
  upvotes: number;
  commentsCount: number;
  comments: Comment[];
  isReported: boolean;
  reportCount: number;
  reportReason?: string;
  createdAt: string;
}

const STORAGE_KEY = 'timisoara_hub_forum_posts_v1';
const UPVOTES_KEY = 'timisoara_hub_user_upvotes_v1';
const REPORTS_KEY = 'timisoara_hub_user_reports_v1';

const INITIAL_POSTS: Post[] = [
  {
    id: 'post-001',
    category: 'lost_pets',
    title: 'Lost Orange Tabby in Fabric (Ștefan cel Mare St.)',
    content: '2-year-old ginger cat answers to Milo. Blue collar with small bell. Got spooked and ran towards the Bega canal.',
    authorName: 'Ana Radu',
    neighbourhood: 'Fabric',
    photos: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80'],
    upvotes: 18,
    commentsCount: 2,
    comments: [
      { id: 'c1', authorName: 'Ion Ionescu', content: 'I think I spotted him behind Millennium Church near the park!', createdAt: '1h ago' },
      { id: 'c2', authorName: 'Ana Radu', content: 'Heading there right now to search, thank you so much!', createdAt: '30m ago' },
    ],
    isReported: false,
    reportCount: 0,
    createdAt: 'Today, 11:00',
  },
  {
    id: 'post-002',
    category: 'neighbourhood',
    title: 'Volunteer Bega Riverbank Cleanup (Iosefin / D’arc deck)',
    content: 'Meeting Saturday at 10:00 to pick up litter along the promenade. Trash bags and gloves provided for everyone!',
    authorName: 'Mihai Voinea',
    neighbourhood: 'Iosefin',
    photos: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80'],
    upvotes: 34,
    commentsCount: 1,
    comments: [
      { id: 'c3', authorName: 'Elena D.', content: 'Joining with two friends from Politehnica University!', createdAt: '2h ago' },
    ],
    isReported: false,
    reportCount: 0,
    createdAt: 'Today, 10:15',
  },
  {
    id: 'post-003',
    category: 'help',
    title: 'Heating outage in Student Complex — warm study spaces?',
    content: 'Colterm district heating repair on network pipe. Where can students go to study with dependable heating and Wi-Fi?',
    authorName: 'Alex Popa',
    neighbourhood: 'Complexul Studențesc',
    photos: [],
    upvotes: 27,
    commentsCount: 1,
    comments: [
      { id: 'c4', authorName: 'Maria C.', content: 'Faber Co-working and Central University Library (BCUT) are both warm, open late, and welcoming students!', createdAt: '45m ago' },
    ],
    isReported: false,
    reportCount: 0,
    createdAt: 'Today, 13:50',
  },
  {
    id: 'post-004',
    category: 'buy_sell',
    title: 'Overpriced concert tickets Piața Unirii',
    content: 'Selling 3 orchestra tickets at double face value, cash payment only in Union Square.',
    authorName: 'Anon99',
    neighbourhood: 'Cetate',
    photos: [],
    upvotes: 0,
    commentsCount: 0,
    comments: [],
    isReported: true,
    reportCount: 3,
    reportReason: 'Ticket scalping and speculative resale spam',
    createdAt: 'Today, 14:10',
  },
];

class ForumStore {
  private posts: Post[] = INITIAL_POSTS;
  private userUpvoted: Set<string> = new Set();
  private userReported: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();
  private isLoaded = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (this.isLoaded) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rawPosts = window.localStorage.getItem(STORAGE_KEY);
        if (rawPosts) {
          const parsed = JSON.parse(rawPosts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.posts = parsed;
          }
        }

        const rawUpvotes = window.localStorage.getItem(UPVOTES_KEY);
        if (rawUpvotes) {
          const parsedUpvotes = JSON.parse(rawUpvotes);
          if (Array.isArray(parsedUpvotes)) {
            this.userUpvoted = new Set(parsedUpvotes);
          }
        }

        const rawReports = window.localStorage.getItem(REPORTS_KEY);
        if (rawReports) {
          const parsedReports = JSON.parse(rawReports);
          if (Array.isArray(parsedReports)) {
            this.userReported = new Set(parsedReports);
          }
        }
      }
    } catch (err) {
      console.warn('[ForumStore] Storage read fallback:', err);
    }
    this.isLoaded = true;
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.posts));
        window.localStorage.setItem(UPVOTES_KEY, JSON.stringify(Array.from(this.userUpvoted)));
        window.localStorage.setItem(REPORTS_KEY, JSON.stringify(Array.from(this.userReported)));
      }
    } catch (err) {
      console.warn('[ForumStore] Storage write fallback:', err);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[ForumStore] Listener error:', err);
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getPosts(): Post[] {
    return [...this.posts];
  }

  hasUserUpvoted(postId: string): boolean {
    return this.userUpvoted.has(postId);
  }

  hasUserReported(postId: string): boolean {
    return this.userReported.has(postId);
  }

  createPost(data: {
    title: string;
    content: string;
    category: 'lost_pets' | 'neighbourhood' | 'help' | 'buy_sell' | 'cultural';
    neighbourhood: string;
    authorName: string;
    photos?: string[];
  }): Post {
    const newPost: Post = {
      id: `post-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      category: data.category,
      title: data.title.trim(),
      content: data.content.trim(),
      authorName: data.authorName.trim() || 'Resident',
      neighbourhood: data.neighbourhood || 'Cetate',
      photos: data.photos && data.photos.length > 0 ? data.photos : [],
      upvotes: 0,
      commentsCount: 0,
      comments: [],
      isReported: false,
      reportCount: 0,
      createdAt: 'Just now',
    };

    this.posts = [newPost, ...this.posts];
    this.saveToStorage();

    // Fire-and-forget sync to backend API if available
    this.syncCreateToBackend(newPost).catch(() => {});

    return newPost;
  }

  addComment(postId: string, authorName: string, content: string): boolean {
    if (!content.trim()) return false;
    const newComment: Comment = {
      id: `c-${Date.now().toString(36)}`,
      authorName: authorName.trim() || 'Resident',
      content: content.trim(),
      createdAt: 'Just now',
    };

    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        const comments = [...p.comments, newComment];
        return {
          ...p,
          comments,
          commentsCount: comments.length,
        };
      }
      return p;
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Toggles upvote on a post:
   * - If not upvoted yet: +1 upvote, marks post as upvoted by user
   * - If already upvoted: -1 upvote, removes user upvote
   * Prevents duplicate/infinite upvotes!
   */
  toggleUpvote(postId: string): { upvoted: boolean; count: number } {
    let isNowUpvoted = false;
    let newCount = 0;

    if (this.userUpvoted.has(postId)) {
      this.userUpvoted.delete(postId);
      isNowUpvoted = false;
    } else {
      this.userUpvoted.add(postId);
      isNowUpvoted = true;
    }

    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        newCount = isNowUpvoted ? p.upvotes + 1 : Math.max(0, p.upvotes - 1);
        return { ...p, upvotes: newCount };
      }
      return p;
    });

    this.saveToStorage();
    return { upvoted: isNowUpvoted, count: newCount };
  }

  /**
   * Reports a post for moderator review.
   * Prevents a single user from reporting the same post multiple times!
   */
  reportPost(postId: string, reason: string = 'Inappropriate content'): { success: boolean; alreadyReported?: boolean } {
    if (this.userReported.has(postId)) {
      return { success: false, alreadyReported: true };
    }

    this.userReported.add(postId);

    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          isReported: true,
          reportCount: (p.reportCount || 0) + 1,
          reportReason: reason,
        };
      }
      return p;
    });

    this.saveToStorage();
    return { success: true };
  }

  approvePost(postId: string): void {
    this.posts = this.posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          isReported: false,
          reportCount: 0,
          reportReason: undefined,
        };
      }
      return p;
    });
    this.saveToStorage();
  }

  deletePost(postId: string): void {
    this.posts = this.posts.filter((p) => p.id !== postId);
    this.userUpvoted.delete(postId);
    this.userReported.delete(postId);
    this.saveToStorage();
  }

  private async syncCreateToBackend(post: Post) {
    try {
      await fetch('http://localhost:8000/v1/m/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          authorName: post.authorName,
          category: post.category,
          neighbourhood: post.neighbourhood,
          photos: post.photos,
        }),
      });
    } catch {
      // Backend offline: post is safely saved in local storage
    }
  }
}

export const forumStore = new ForumStore();
