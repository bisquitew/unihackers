import { ForumPost, CreatePostInput, ReportPostInput, ForumComment } from './types';
import { seedForumPosts } from './seed';

export class ForumService {
  private posts: ForumPost[] = [...seedForumPosts];

  async listPosts(category?: string, neighbourhood?: string): Promise<ForumPost[]> {
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
    const post = this.posts.find((p) => p.id === id);
    return post || null;
  }

  async createPost(input: CreatePostInput): Promise<ForumPost> {
    const newPost: ForumPost = {
      id: `post-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
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
    this.posts.unshift(newPost);
    return newPost;
  }

  async addComment(postId: string, authorName: string, content: string, authorId?: string): Promise<ForumComment | null> {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return null;

    const comment: ForumComment = {
      id: `cmt-${Date.now().toString(36)}`,
      postId,
      authorId: authorId || `usr-anon`,
      authorName,
      content,
      createdAt: new Date().toISOString(),
    };

    post.comments.push(comment);
    post.commentsCount = post.comments.length;
    return comment;
  }

  async upvotePost(postId: string): Promise<{ success: boolean; upvotes: number }> {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return { success: false, upvotes: 0 };
    post.upvotes += 1;
    return { success: true, upvotes: post.upvotes };
  }

  async reportPost(input: ReportPostInput): Promise<{ success: boolean; isReported: boolean }> {
    const post = this.posts.find((p) => p.id === input.postId);
    if (!post) return { success: false, isReported: false };

    post.isReported = true;
    post.reportCount += 1;
    if (!post.reportReasons) post.reportReasons = [];
    post.reportReasons.push(`${input.reason}${input.note ? `: ${input.note}` : ''}`);

    return { success: true, isReported: true };
  }

  async getModerationReports(): Promise<ForumPost[]> {
    return this.posts.filter((p) => p.isReported);
  }
}

export const forumService = new ForumService();
