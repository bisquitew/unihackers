import { buddyService } from './service.ts';

export const buddyAssistantTools = [
  {
    name: 'find_event_buddies',
    description: 'Finds people looking for companions/buddies to go to cultural events in Timișoara',
    parameters: {
      type: 'OBJECT',
      properties: {
        eventId: {
          type: 'STRING',
          description: 'The event ID to look up buddies for',
        },
      },
      required: ['eventId'],
    },
    handler: async (args: { eventId: string }) => {
      const buddies = await buddyService.listRequests(args.eventId);
      return {
        count: buddies.length,
        buddies: buddies.map((b) => ({
          userName: b.userName,
          university: b.university,
          bio: b.bio,
          interests: b.interests,
          icebreaker: b.icebreakerPrompt,
        })),
      };
    },
  },
];
