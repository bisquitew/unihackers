import type { ParkingLot, ParkingLotStatusColor } from '@hub/contracts';
import { PARKIE_SEED_LOTS } from '@hub/contracts';
import { calculateDistanceMeters } from '../../core/areas.ts';
import { eventBus } from '../../core/events.ts';

// In-memory parking lot store initialized with Timișoara lots
let parkingLots: ParkingLot[] = [...PARKIE_SEED_LOTS];

export function computeStatusColor(available: number, capacity: number): ParkingLotStatusColor {
  if (capacity <= 0 || available <= 0) return 'red';
  const ratio = available / capacity;
  if (ratio <= 0.25) return 'yellow';
  return 'green';
}

export const parkieService = {
  getAllLots(filter?: { min_available?: number; status_color?: string; verified_only?: boolean }): ParkingLot[] {
    return parkingLots.filter((lot) => {
      if (filter?.verified_only !== false && !lot.is_verified) return false;
      if (filter?.status_color && lot.status_color !== filter.status_color) return false;
      if (filter?.min_available !== undefined && lot.available_spots < filter.min_available) return false;
      return true;
    });
  },

  getLotById(id: string): ParkingLot | undefined {
    return parkingLots.find((lot) => lot.id === id);
  },

  getLotColorsOnly(): Array<{ id: string; name: string; status_color: ParkingLotStatusColor; available_spots: number; capacity: number }> {
    return parkingLots.map((lot) => ({
      id: lot.id,
      name: lot.name,
      status_color: lot.status_color,
      available_spots: lot.available_spots,
      capacity: lot.capacity
    }));
  },

  async updateDetections(lotId: string, detectedCars: number): Promise<ParkingLot | null> {
    const lot = parkingLots.find((l) => l.id === lotId);
    if (!lot) return null;

    const boundedCars = Math.min(Math.max(0, detectedCars), lot.capacity);
    lot.available_spots = Math.max(0, lot.capacity - boundedCars);
    lot.status_color = computeStatusColor(lot.available_spots, lot.capacity);
    lot.last_updated = new Date().toISOString();

    await eventBus.emit('parkie.detection_updated', {
      lotId: lot.id,
      lotName: lot.name,
      availableSpots: lot.available_spots,
      statusColor: lot.status_color
    });

    console.log(`[PARKIE AI] 🚗 Lot "${lot.name}": ${detectedCars} detected cars -> ${lot.available_spots}/${lot.capacity} spots available [${lot.status_color.toUpperCase()}]`);

    return lot;
  },

  async createLot(payload: Partial<ParkingLot> & { name: string; latitude: number; longitude: number; capacity: number }): Promise<ParkingLot> {
    const capacity = payload.capacity || 50;
    const available = payload.available_spots !== undefined ? payload.available_spots : capacity;

    const newLot: ParkingLot = {
      id: payload.id || crypto.randomUUID(),
      owner_id: payload.owner_id,
      name: payload.name,
      latitude: payload.latitude,
      longitude: payload.longitude,
      camera_url: payload.camera_url || null,
      slots_data: payload.slots_data || [],
      capacity,
      available_spots: available,
      status_color: computeStatusColor(available, capacity),
      is_verified: payload.is_verified ?? true,
      last_updated: new Date().toISOString()
    };

    parkingLots.push(newLot);

    await eventBus.emit('parkie.lot_created', { lotId: newLot.id, name: newLot.name });
    return newLot;
  },

  findNearestLots(lat: number, lng: number, limit = 5): Array<ParkingLot & { distance_meters: number }> {
    return parkingLots
      .map((lot) => ({
        ...lot,
        distance_meters: Math.round(calculateDistanceMeters(lat, lng, lot.latitude, lot.longitude))
      }))
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, limit);
  }
};
