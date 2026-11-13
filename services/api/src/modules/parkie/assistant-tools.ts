import type { AssistantToolDeclaration } from '@hub/contracts';
import { parkieService } from './service.ts';
import { getAreaBySlugOrName } from '../../core/areas.ts';

export const parkieAssistantTools: AssistantToolDeclaration[] = [
  {
    name: 'findParkingSpots',
    description: 'Find real-time parking lot availability in Timișoara (e.g. Piața Unirii, Iulius Town, Bega, Piața 700) using Parkie computer-vision data.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The location, area, or landmark in Timișoara (e.g. "Centru", "Unirii", "Iulius Town", "Gara de Nord").'
        }
      },
      required: ['location']
    },
    handler: async (args: { location: string }) => {
      const area = getAreaBySlugOrName(args.location);
      if (area) {
        const nearest = parkieService.findNearestLots(area.center_lat, area.center_lng, 3);
        return {
          searched_area: area.name,
          lots: nearest.map((l) => ({
            name: l.name,
            available_spots: l.available_spots,
            capacity: l.capacity,
            status: l.status_color,
            distance_meters: l.distance_meters
          }))
        };
      }

      // Default to central lots
      const lots = parkieService.getAllLots().slice(0, 3);
      return {
        searched_area: args.location,
        lots: lots.map((l) => ({
          name: l.name,
          available_spots: l.available_spots,
          capacity: l.capacity,
          status: l.status_color
        }))
      };
    }
  }
];
