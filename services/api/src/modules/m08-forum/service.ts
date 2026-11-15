import type { ForumPost, CreatePostInput, ReportPostInput, ForumComment } from './types.ts';
import { seedForumPosts } from './seed.ts';
import { db } from '../../core/db.ts';

// Posts live in m08_forum_posts. Comments, upvotes and reports live in their own tables (created here when missing,
// see db/modules/m08-forum/migrations/0002_comments_votes_reports.sql) and are loaded into memory once at start, so
// they survive a restart. Without a database everything stays in memory, starting from the seed posts.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS m08_forum_comments (
     id VARCHAR(64) PRIMARY KEY, post_id VARCHAR(64) NOT NULL, author_id VARCHAR(255) NOT NULL,
     author_name VARCHAR(255) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE INDEX IF NOT EXISTS idx_m08_comments_post ON m08_forum_comments (post_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS m08_forum_votes (
     post_id VARCHAR(64) NOT NULL, user_sub VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (post_id, user_sub))`,
  `CREATE TABLE IF NOT EXISTS m08_forum_reports (
     post_id VARCHAR(64) NOT NULL, user_sub VARCHAR(255) NOT NULL, reason TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (post_id, user_sub))`,
];

function rowToPost(row: any): ForumPost {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    content: row.content,
    authorId: row.author_id || row.authorId,
    authorName: row.author_name || row.authorName,
    neighbourhood: row.neighbourhood,
    photos: Array.isArray(row.photos) ? row.photos : [],
    upvotes: Number(row.upvotes || 0),
    commentsCount: Number(row.comments_count ?? row.commentsCount ?? 0),
    comments: [],
    isReported: false,
    reportCount: 0,
    createdAt: new Date(row.created_at || row.createdAt).toISOString(),
  };
}

export type PostView = ForumPost & { viewerUpvoted: boolean; viewerReported: boolean };

export class ForumService {
  /** post bodies when there is no database */
  private posts: ForumPost[] = [...seedForumPosts];
  private comments = new Map<string, ForumComment[]>();
  private upvoters = new Map<string, Set<string>>();
  /** post id -> (user -> reason) */
  private reports = new Map<string, Map<string, string>>();
  private ready: Promise<void> | null = null;

  constructor() {
    // the seed posts carry their own comments
    for (const p of this.posts) if (p.comments?.length) this.comments.set(p.id, [...p.comments]);
  }

  /** Creates the tables if needed and loads comments, votes and reports. Runs once, on first use. */
  private init(): Promise<void> {
    this.ready ??= (async () => {
      if (!db.isTigerConnected()) return;
      try {
        for (const sql of SCHEMA) await db.query(sql);
        const [comments, votes, reports] = await Promise.all([
          db.query<any>(`SELECT id, post_id, author_id, author_name, content, created_at FROM m08_forum_comments ORDER BY created_at`),
          db.query<any>(`SELECT post_id, user_sub FROM m08_forum_votes`),
          db.query<any>(`SELECT post_id, user_sub, reason FROM m08_forum_reports`),
        ]);
        for (const c of comments) {
          const list = this.comments.get(c.post_id) ?? [];
          if (!list.some((x) => x.id === c.id)) {
            list.push({ id: c.id, postId: c.post_id, authorId: c.author_id, authorName: c.author_name, content: c.content, createdAt: new Date(c.created_at).toISOString() });
          }
          this.comments.set(c.post_id, list);
        }
        for (const v of votes) this.setOf(this.upvoters, v.post_id).add(v.user_sub);
        for (const r of reports) this.reportsOf(r.post_id).set(r.user_sub, r.reason);
      } catch (err: any) {
        console.warn('[m08-forum] could not load comments, votes and reports:', err.message);
      }
    })();
    return this.ready;
  }

  private setOf(map: Map<string, Set<string>>, id: string) {
    let s = map.get(id);
    if (!s) map.set(id, (s = new Set()));
    return s;
  }
  private reportsOf(id: string) {
    let m = this.reports.get(id);
    if (!m) this.reports.set(id, (m = new Map()));
    return m;
  }

  /** A post with its comments and open reports laid over it. */
  private live(p: ForumPost): ForumPost {
    const comments = this.comments.get(p.id) ?? [];
    const reasons = [...(this.reports.get(p.id)?.values() ?? [])];
    return {
      ...p,
      comments,
      // the number is the comments there really are (a stored or seeded number can disagree with them)
      commentsCount: comments.length,
      isReported: reasons.length > 0,
      reportCount: reasons.length,
      reportReasons: reasons,
    };
  }

  view(post: ForumPost, viewerSub?: string): PostView {
    return {
      ...post,
      viewerUpvoted: !!viewerSub && !!this.upvoters.get(post.id)?.has(viewerSub),
      viewerReported: !!viewerSub && !!this.reports.get(post.id)?.has(viewerSub),
    };
  }

  async listPosts(category?: string, neighbourhood?: string): Promise<ForumPost[]> {
    await this.init();
    let list: ForumPost[] | null = null;
    if (db.isTigerConnected()) {
      try {
        const rows = await db.query<any>(`
          SELECT id, category, title, content, author_id, author_name,
                 neighbourhood, photos, upvotes, comments_count, pinned, created_at
          FROM m08_forum_posts
          WHERE status = 'active'
          ORDER BY pinned DESC, created_at DESC;
        `);
        if (rows && rows.length > 0) list = rows.map(rowToPost);
      } catch (err: any) {
        console.warn('ForumService TimescaleDB fallback:', err.message);
      }
    }
    if (!list) list = [...this.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (category && category !== 'all') list = list.filter((p) => p.category === category);
    if (neighbourhood && neighbourhood !== 'all') list = list.filter((p) => p.neighbourhood.toLowerCase() === neighbourhood.toLowerCase());
    return list.map((p) => this.live(p));
  }

  async getPostById(id: string): Promise<ForumPost | null> {
    await this.init();
    if (db.isTigerConnected()) {
      try {
        const rows = await db.query<any>(`
          SELECT id, category, title, content, author_id, author_name,
                 neighbourhood, photos, upvotes, comments_count, pinned, created_at
          FROM m08_forum_posts
          WHERE id = $1 AND status = 'active' LIMIT 1;
        `, [id]);
        if (rows && rows.length > 0) return this.live(rowToPost(rows[0]));
      } catch {}
    }
    const post = this.posts.find((p) => p.id === id);
    return post ? this.live(post) : null;
  }

  async createPost(input: CreatePostInput): Promise<ForumPost> {
    await this.init();
    const id = `post-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const newPost: ForumPost = {
      id,
      category: input.category,
      title: input.title,
      content: input.content,
      authorId: input.authorId || `usr-${Date.now().toString(36)}`,
      authorName: input.authorName,
      neighbourhood: input.neighbourhood,
      photos: input.photos || [],
      upvotes: 0,
      commentsCount: 0,
      comments: [],
      isReported: false,
      reportCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (db.isTigerConnected()) {
      try {
        await db.query(`
          INSERT INTO m08_forum_posts (
            id, category, title, content, author_id, author_name,
            neighbourhood, photos, upvotes, comments_count, pinned, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, false, 'active', NOW(), NOW());
        `, [
          id, newPost.category, newPost.title, newPost.content,
          newPost.authorId, newPost.authorName, newPost.neighbourhood, newPost.photos
        ]);
      } catch (err: any) {
        console.warn('ForumService createPost TimescaleDB error:', err.message);
      }
    }

    this.posts.unshift(newPost);
    return newPost;
  }

  async addComment(postId: string, authorName: string, content: string, authorId?: string): Promise<ForumComment | null> {
    const post = await this.getPostById(postId);
    if (!post) return null;

    const comment: ForumComment = {
      id: `cmt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      postId,
      authorId: authorId || `usr-anon`,
      authorName,
      content,
      createdAt: new Date().toISOString(),
    };
    const list = this.comments.get(postId) ?? [];
    list.push(comment);
    this.comments.set(postId, list);

    if (db.isTigerConnected()) {
      try {
        await db.query(`INSERT INTO m08_forum_comments (id, post_id, author_id, author_name, content, created_at) VALUES ($1, $2, $3, $4, $5, $6);`,
          [comment.id, postId, comment.authorId, authorName, content, comment.createdAt]);
        await db.query(`UPDATE m08_forum_posts SET comments_count = $2 WHERE id = $1;`, [postId, list.length]);
      } catch (err: any) {
        console.warn('ForumService addComment error:', err.message);
      }
    }
    return comment;
  }

  async upvotePost(postId: string, userSub = 'anonymous'): Promise<{ success: boolean; upvotes: number; upvoted: boolean }> {
    const post = await this.getPostById(postId);
    if (!post) return { success: false, upvotes: 0, upvoted: false };
    const set = this.setOf(this.upvoters, postId);
    const upvoted = !set.has(userSub);
    if (upvoted) set.add(userSub);
    else set.delete(userSub);
    const upvotes = Math.max(0, post.upvotes + (upvoted ? 1 : -1));

    const memory = this.posts.find((p) => p.id === postId);
    if (memory) memory.upvotes = upvotes;

    if (db.isTigerConnected()) {
      try {
        if (upvoted) await db.query(`INSERT INTO m08_forum_votes (post_id, user_sub) VALUES ($1, $2) ON CONFLICT DO NOTHING;`, [postId, userSub]);
        else await db.query(`DELETE FROM m08_forum_votes WHERE post_id = $1 AND user_sub = $2;`, [postId, userSub]);
        await db.query(`UPDATE m08_forum_posts SET upvotes = $1 WHERE id = $2;`, [upvotes, postId]);
      } catch {}
    }
    return { success: true, upvotes, upvoted };
  }

  async reportPost(input: ReportPostInput): Promise<{ success: boolean; isReported: boolean }> {
    const post = await this.getPostById(input.postId);
    if (!post) return { success: false, isReported: false };

    const by = input.reportedBy || 'anonymous';
    const reports = this.reportsOf(post.id);
    if (reports.has(by)) return { success: true, isReported: true };
    const reason = `${input.reason}${input.note ? `: ${input.note}` : ''}`;
    reports.set(by, reason);

    if (db.isTigerConnected()) {
      try {
        await db.query(`INSERT INTO m08_forum_reports (post_id, user_sub, reason) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`, [post.id, by, reason]);
      } catch {}
    }
    return { success: true, isReported: true };
  }

  async getModerationReports(): Promise<ForumPost[]> {
    await this.init();
    const ids = [...this.reports.entries()].filter(([, m]) => m.size > 0).map(([id]) => id);
    const posts = await Promise.all(ids.map((id) => this.getPostById(id)));
    return posts.filter((p): p is ForumPost => !!p);
  }

  async approvePost(postId: string): Promise<boolean> {
    const post = await this.getPostById(postId);
    if (!post) return false;
    this.reports.delete(postId);
    if (db.isTigerConnected()) {
      try {
        await db.query(`DELETE FROM m08_forum_reports WHERE post_id = $1;`, [postId]);
      } catch {}
    }
    return true;
  }

  async deletePost(postId: string): Promise<boolean> {
    const existed = !!(await this.getPostById(postId));
    if (db.isTigerConnected()) {
      try {
        await db.query(`UPDATE m08_forum_posts SET status = 'deleted' WHERE id = $1;`, [postId]);
        await db.query(`DELETE FROM m08_forum_reports WHERE post_id = $1;`, [postId]);
      } catch {}
    }
    this.reports.delete(postId);
    const idx = this.posts.findIndex((p) => p.id === postId);
    if (idx !== -1) this.posts.splice(idx, 1);
    return existed || idx !== -1;
  }
}

export const forumService = new ForumService();
