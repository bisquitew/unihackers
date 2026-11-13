import type { AssistantToolDeclaration } from '@hub/contracts';
import { utilitiesService } from './service.ts';

export const utilitiesAssistantTools: AssistantToolDeclaration[] = [
  {
    name: 'checkUtilityOutages',
    description: 'Check if there are any heating, hot water, cold water, or power outages in a specific neighbourhood or street in Timișoara (e.g. Colterm or Aquatim cuts).',
    parameters: {
      type: 'object',
      properties: {
        addressOrArea: {
          type: 'string',
          description: 'The neighbourhood, street, or address in Timișoara to check (e.g. "Circumvalațiunii", "Complex Studențesc", "Strada Gheorghe Lazăr").'
        }
      },
      required: ['addressOrArea']
    },
    handler: async (args: { addressOrArea: string }) => {
      const result = utilitiesService.checkAddressImpact(args.addressOrArea);
      return result;
    }
  }
];
