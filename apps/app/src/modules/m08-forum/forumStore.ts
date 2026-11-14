// Forum for [M08_FORUM]. The API is the source of truth (/v1/m/forum: posts, comments, upvotes, reports). Changes show on
// screen at once and are sent in the background; the list is then reloaded from the server. The list is also kept in local
// storage as a cache, so the forum still opens with something to read when the server cannot be reached.
import { api } from '../../core/api';

/** "2026-11-14T10:20:00Z" -> "now", "5m ago", "3h ago", "Yesterday", "12 Nov". Anything else stays as it is. */
export function friendlyAgo(value: string, now = new Date()): string {
  const d = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}/.test(value) || Number.isNaN(d.getTime())) return value;
  const mins = Math.round((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)}h ago`;
  if (mins < 48 * 60) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fromApi(p: any): Post {
  return {
    id: p.id,
    category: p.category,
    title: p.title,
    content: p.content,
    authorName: p.authorName,
    neighbourhood: p.neighbourhood,
    photos: p.photos ?? [],
    upvotes: p.upvotes ?? 0,
    commentsCount: p.commentsCount ?? (p.comments?.length ?? 0),
    comments: (p.comments ?? []).map((c: any) => ({ id: c.id, authorName: c.authorName, content: c.content, createdAt: friendlyAgo(c.createdAt) })),
    isReported: !!p.isReported,
    reportCount: p.reportCount ?? 0,
    reportReason: p.reportReasons?.[0],
    createdAt: friendlyAgo(p.createdAt),
  };
}

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
    void this.refresh();
  }

  /** Loads the posts from the API, including which ones this person upvoted or reported. Keeps the cache when offline. */
  async refresh(): Promise<void> {
    try {
      const { posts } = await api.get<{ posts: any[] }>('/v1/m/forum');
      if (Array.isArray(posts)) {
        this.posts = posts.map(fromApi);
        this.userUpvoted = new Set(posts.filter((p) => p.viewerUpvoted).map((p) => p.id));
        this.userReported = new Set(posts.filter((p) => p.viewerReported).map((p) => p.id));
        this.saveToStorage();
      }
    } catch {
      /* offline: the cached list stays */
    }
  }

  /** Sends one change to the API, then reloads. Failures (offline, not signed in) leave the local change in place. */
  private send(run: () => Promise<unknown>) {
    run()
      .then(() => this.refresh())
      .catch(() => {});
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

    this.send(() => api.post('/v1/m/forum', { title: newPost.title, content: newPost.content, category: newPost.category, neighbourhood: newPost.neighbourhood, photos: newPost.photos }));

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
    this.send(() => api.post(`/v1/m/forum/${encodeURIComponent(postId)}/comments`, { content: newComment.content }));
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
    this.send(() => api.post(`/v1/m/forum/${encodeURIComponent(postId)}/upvote`));
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
    this.send(() => api.post(`/v1/m/forum/${encodeURIComponent(postId)}/report`, { reason: 'inappropriate', note: reason }));
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
}

export const forumStore = new ForumStore();
