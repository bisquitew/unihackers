import { forumService } from './service.ts';

export const forumAssistantTools = [
  {
    name: 'search_forum_posts',
    description: 'Searches community forum posts in Timișoara by category (lost_pets, neighbourhood, help) or neighbourhood name',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: {
          type: 'STRING',
          description: 'Filter category: lost_pets, neighbourhood, help, buy_sell, cultural',
        },
        neighbourhood: {
          type: 'STRING',
          description: 'Timișoara neighbourhood: Fabric, Iosefin, Cetate, Complexul Studențesc, etc.',
        },
      },
    },
    handler: async (args: { category?: string; neighbourhood?: string }) => {
      const posts = await forumService.listPosts(args.category, args.neighbourhood);
      return {
        count: posts.length,
        posts: posts.slice(0, 5).map((p) => ({
          title: p.title,
          category: p.category,
          neighbourhood: p.neighbourhood,
          content: p.content,
          author: p.authorName,
          commentsCount: p.commentsCount,
        })),
      };
    },
  },
  {
    name: 'search_lost_pets',
    description: 'Finds reported lost animals or pets in Timișoara',
    parameters: {
      type: 'OBJECT',
      properties: {
        neighbourhood: {
          type: 'STRING',
          description: 'Specific neighbourhood where the pet was seen or lost',
        },
      },
    },
    handler: async (args: { neighbourhood?: string }) => {
      const posts = await forumService.listPosts('lost_pets', args.neighbourhood);
      return {
        lostPets: posts.map((p) => ({
          title: p.title,
          neighbourhood: p.neighbourhood,
          description: p.content,
          contact: p.authorName,
          photos: p.photos,
        })),
      };
    },
  },
];
