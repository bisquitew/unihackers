import { Hono } from 'hono';
import { forumService } from './service';
import { CreatePostInput, ReportPostInput } from './types';

export const forumRoutes = new Hono();

// List posts with optional category or neighbourhood filters
forumRoutes.get('/', async (c) => {
  const category = c.req.query('category');
  const neighbourhood = c.req.query('neighbourhood');
  const posts = await forumService.listPosts(category, neighbourhood);
  return c.json({ posts });
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
    if (!body.title || !body.content || !body.authorName || !body.category) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    const newPost = await forumService.createPost(body);
    return c.json({ post: newPost }, 201);
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
});

// Add comment to a post
forumRoutes.post('/:id/comments', async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json<{ authorName: string; content: string; authorId?: string }>();
    if (!body.authorName || !body.content) {
      return c.json({ error: 'authorName and content are required' }, 400);
    }
    const comment = await forumService.addComment(id, body.authorName, body.content, body.authorId);
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
  const result = await forumService.upvotePost(id);
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
      note: body.note,
      reportedBy: body.reportedBy,
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
