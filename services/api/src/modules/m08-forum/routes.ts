import { Hono } from 'hono';
import { forumService } from './service.ts';
import type { CreatePostInput, ReportPostInput } from './types.ts';

export const forumRoutes = new Hono();

// The signed-in person (the app's auth middleware sets it); guests have the sub "guest|unauthenticated"
const who = (c: any): { sub: string; name: string; signedIn: boolean } => {
  const u = c.get('user');
  return { sub: u?.sub ?? 'anonymous', name: u?.name ?? 'Resident', signedIn: !!u && u.sub !== 'guest|unauthenticated' };
};
const tooLong = (value: unknown, max: number) => typeof value !== 'string' || value.trim().length === 0 || value.length > max;

// List posts with optional category or neighbourhood filters, each with this viewer's own upvote/report state
forumRoutes.get('/', async (c) => {
  const category = c.req.query('category');
  const neighbourhood = c.req.query('neighbourhood');
  const posts = await forumService.listPosts(category, neighbourhood);
  const me = who(c);
  return c.json({ posts: posts.map((p) => forumService.view(p, me.signedIn ? me.sub : undefined)) });
});

// Get post details with comments
forumRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const post = await forumService.getPostById(id);
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json({ post });
});

// Create new post
forumRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<CreatePostInput>();
    if (!body.title || !body.content || !body.category) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    if (tooLong(body.title, 120) || tooLong(body.content, 2000)) {
      return c.json({ error: 'too_long', error_description: 'A title can be 120 characters and a post 2000.' }, 400);
    }
    const me = who(c);
    // the author is the signed-in person, not whoever the request says
    const newPost = await forumService.createPost({ ...body, authorId: me.sub, authorName: me.name });
    return c.json({ post: newPost }, 201);
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
});

// Add comment to a post
forumRoutes.post('/:id/comments', async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json<{ content: string }>();
    if (tooLong(body.content, 1000)) {
      return c.json({ error: 'invalid_comment', error_description: 'A comment needs some text, at most 1000 characters.' }, 400);
    }
    const me = who(c);
    const comment = await forumService.addComment(id, me.name, body.content, me.sub);
    if (!comment) {
      return c.json({ error: 'Post not found' }, 404);
    }
    return c.json({ comment }, 201);
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
});

// Upvote post
forumRoutes.post('/:id/upvote', async (c) => {
  const id = c.req.param('id');
  const result = await forumService.upvotePost(id, who(c).sub);
  if (!result.success) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json(result);
});

// Report post (moderation)
forumRoutes.post('/:id/report', async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json<Omit<ReportPostInput, 'postId'>>();
    const result = await forumService.reportPost({
      postId: id,
      reason: body.reason || 'other',
      note: typeof body.note === 'string' ? body.note.slice(0, 300) : undefined,
      reportedBy: who(c).sub,
    });
    if (!result.success) {
      return c.json({ error: 'Post not found' }, 404);
    }
    return c.json({ message: 'Post reported for moderator review' });
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
});

// Moderator queue
forumRoutes.get('/moderation/reported', async (c) => {
  const reports = await forumService.getModerationReports();
  return c.json({ reportedPosts: reports });
});

// Moderator: Approve & keep post (dismiss reports)
forumRoutes.post('/moderation/:id/approve', async (c) => {
  const id = c.req.param('id');
  const ok = await forumService.approvePost(id);
  if (!ok) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json({ success: true, message: 'Post approved and retained in feed' });
});

// Moderator: Delete inappropriate post
forumRoutes.delete('/moderation/:id', async (c) => {
  const id = c.req.param('id');
  const ok = await forumService.deletePost(id);
  if (!ok) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json({ success: true, message: 'Post permanently removed by moderator' });
});
