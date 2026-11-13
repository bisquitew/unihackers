import { eventsService } from './service';

export const eventsAssistantTools = [
  {
    name: 'find_local_events',
    description: 'Finds cultural micro-events in Timișoara by category (cinema, music, workshop, showcase) or neighbourhood',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: {
          type: 'STRING',
          description: 'Category: cinema, music, workshop, showcase, social',
        },
        neighbourhood: {
          type: 'STRING',
          description: 'Neighbourhood in Timișoara (e.g. Fabric, Elisabetin, Iosefin, Cetate)',
        },
      },
    },
    handler: async (args: { category?: string; neighbourhood?: string }) => {
      const events = await eventsService.listEvents(args);
      return {
        eventsCount: events.length,
        events: events.map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          location: e.locationName,
          neighbourhood: e.neighbourhood,
          dateTime: e.dateTime,
          isFree: e.isFree,
          price: e.priceAmount,
        })),
      };
    },
  },
];
