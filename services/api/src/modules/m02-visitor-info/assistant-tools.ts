import { visitorInfoService } from './service.ts';
import type { VisitorLang } from './types.ts';

export const visitorInfoAssistantTools = [
  {
    name: 'search_visitor_info',
    description:
      'Practical information for visitors and newcomers in Timișoara: emergency number, public transport tickets and how to pay, getting from the airport or the train station to the centre, the tourist information centre, money and payments, where to find outages and detours. Returns the best matching entries with their source and whether they need checking before travel (prices and schedules change).',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keywords from the question, e.g. "tram ticket price", "airport to centre", "emergency number".',
        },
        language: {
          type: 'string',
          enum: ['ro', 'en'],
          description: 'Language of the user question; entries are returned in this language.',
        },
      },
      required: ['query'],
    },
    handler: async (args: { query?: string; language?: string }) => {
      const lang: VisitorLang = args.language === 'en' ? 'en' : 'ro';
      const results = visitorInfoService.search(String(args.query ?? ''), lang);
      if (results.length === 0) {
        return { results: [], message: 'No visitor info entry matches this question.' };
      }
      return {
        results: results.map((r) => ({
          id: r.id,
          category: r.category,
          title: r.title,
          text: r.text,
          source: r.sources.join(' ; '),
          checked: r.checked,
          needsVerify: r.verify,
        })),
      };
    },
  },
];
