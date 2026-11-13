import type { AssistantToolDeclaration } from '@hub/contracts';
import { transitService } from './service.ts';

export const transitAssistantTools: AssistantToolDeclaration[] = [
  {
    name: 'checkTransitDetours',
    description: 'Check public transport lines and roadwork detours in Timișoara (e.g. tram line 5 suspension, lines 1 & 2 detours, bus 5C).',
    parameters: {
      type: 'object',
      properties: {
        stopOrLine: {
          type: 'string',
          description: 'The transit line number (e.g. "5", "5C", "1") or stop name (e.g. "Calea Bogdăneștilor", "Piața 700") in Timișoara.'
        }
      },
      required: ['stopOrLine']
    },
    handler: async (args: { stopOrLine: string }) => {
      const line = transitService.getLineByNumber(args.stopOrLine);
      if (line) {
        return {
          line_number: line.line_number,
          status: line.status,
          summary: line.current_route_summary,
          detour_alert: line.detour_alert
        };
      }
      return transitService.checkStopImpact(args.stopOrLine);
    }
  }
];
