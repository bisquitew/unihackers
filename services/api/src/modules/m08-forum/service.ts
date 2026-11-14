import type { ForumPost, CreatePostInput, ReportPostInput, ForumComment } from './types.ts';
import { seedForumPosts } from './seed.ts';
import { db } from '../../core/db.ts';

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
  private posts: ForumPost[] = [...seedForumPosts];
  private upvoters = new Map<string, Set<string>>();
  private reporters = new Map<string, Set<string>>();

  view(post: ForumPost, viewerSub?: string): PostView {
    return {
      ...post,
      viewerUpvoted: !!viewerSub && !!this.upvoters.get(post.id)?.has(viewerSub),
      viewerReported: !!viewerSub && !!this.reporters.get(post.id)?.has(viewerSub),
    };
  }

  async listPosts(category?: string, neighbourhood?: string): Promise<ForumPost[]> {
    if (db.isTigerConnected()) {
      try {
        const rows = await db.query<any>(`
          SELECT id, category, title, content, author_id, author_name,
                 neighbourhood, photos, upvotes, comments_count, pinned, created_at
          FROM m08_forum_posts
          WHERE status = 'active'
          ORDER BY pinned DESC, created_at DESC;
        `);
        if (rows && rows.length > 0) {
          let list = rows.map(rowToPost);
          if (category && category !== 'all') {
            list = list.filter((p) => p.category === category);
          }
          if (neighbourhood && neighbourhood !== 'all') {
            list = list.filter((p) => p.neighbourhood.toLowerCase() === neighbourhood.toLowerCase());
          }
          return list;
        }
      } catch (err: any) {
        console.warn('ForumService TimescaleDB fallback:', err.message);
      }
    }

    let result = [...this.posts];
    if (category && category !== 'all') {
      result = result.filter((p) => p.category === category);
    }
    if (neighbourhood && neighbourhood !== 'all') {
      result = result.filter(
        (p) => p.neighbourhood.toLowerCase() === neighbourhood.toLowerCase()
      );
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPostById(id: string): Promise<ForumPost | null> {
    if (db.isTigerConnected()) {
      try {
        const rows = await db.query<any>(`
          SELECT id, category, title, content, author_id, author_name,
                 neighbourhood, photos, upvotes, comments_count, pinned, created_at
          FROM m08_forum_posts
          WHERE id = $1 LIMIT 1;
        `, [id]);
        if (rows && rows.length > 0) {
          return rowToPost(rows[0]);
        }
      } catch {}
    }
    const post = this.posts.find((p) => p.id === id);
    return post || null;
  }

  async createPost(input: CreatePostInput): Promise<ForumPost> {
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
      id: `cmt-${Date.now().toString(36)}`,
      postId,
      authorId: authorId || `usr-anon`,
      authorName,
      content,
      createdAt: new Date().toISOString(),
    };

    if (db.isTigerConnected()) {
      try {
        await db.query(`
          UPDATE m08_forum_posts SET comments_count = comments_count + 1 WHERE id = $1;
        `, [postId]);
      } catch {}
    }

    post.comments.push(comment);
    post.commentsCount = post.comments.length;
    return comment;
  }

  async upvotePost(postId: string, userSub = 'anonymous'): Promise<{ success: boolean; upvotes: number; upvoted: boolean }> {
    const post = await this.getPostById(postId);
    if (!post) return { success: false, upvotes: 0, upvoted: false };
    const set = this.upvoters.get(postId) ?? new Set<string>();
    let isUpvoted = false;
    if (set.has(userSub)) {
      set.delete(userSub);
      post.upvotes = Math.max(0, post.upvotes - 1);
      isUpvoted = false;
    } else {
      set.add(userSub);
      post.upvotes += 1;
      isUpvoted = true;
    }
    this.upvoters.set(postId, set);

    if (db.isTigerConnected()) {
      try {
        await db.query(`UPDATE m08_forum_posts SET upvotes = $1 WHERE id = $2;`, [post.upvotes, postId]);
      } catch {}
    }

    return { success: true, upvotes: post.upvotes, upvoted: isUpvoted };
  }

  async reportPost(input: ReportPostInput): Promise<{ success: boolean; isReported: boolean }> {
    const post = this.posts.find((p) => p.id === input.postId);
    if (!post) return { success: false, isReported: false };

    const by = input.reportedBy || 'anonymous';
    const set = this.reporters.get(post.id) ?? new Set<string>();
    if (set.has(by)) return { success: true, isReported: true };
    set.add(by);
    this.reporters.set(post.id, set);

    post.isReported = true;
    post.reportCount += 1;
    if (!post.reportReasons) post.reportReasons = [];
    post.reportReasons.push(`${input.reason}${input.note ? `: ${input.note}` : ''}`);

    return { success: true, isReported: true };
  }

  async getModerationReports(): Promise<ForumPost[]> {
    return this.posts.filter((p) => p.isReported);
  }

  async approvePost(postId: string): Promise<boolean> {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return false;
    post.isReported = false;
    post.reportCount = 0;
    post.reportReasons = [];
    return true;
  }

  async deletePost(postId: string): Promise<boolean> {
    if (db.isTigerConnected()) {
      try {
        await db.query(`UPDATE m08_forum_posts SET status = 'deleted' WHERE id = $1;`, [postId]);
      } catch {}
    }
    const idx = this.posts.findIndex((p) => p.id === postId);
    if (idx === -1) return false;
    this.posts.splice(idx, 1);
    return true;
  }
}

export const forumService = new ForumService();
