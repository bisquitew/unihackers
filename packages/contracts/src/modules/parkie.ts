import { z } from '../zod-shim.ts';

export const ParkingLotStatusColorSchema = z.enum(['green', 'yellow', 'red', 'gray'] as const);
export type ParkingLotStatusColor = 'green' | 'yellow' | 'red' | 'gray';

export const ParkingLotSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid().optional(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  camera_url: z.string().optional().nullable(),
  slots_data: z.array(z.array(z.number())).default([]),
  capacity: z.number(),
  available_spots: z.number(),
  status_color: ParkingLotStatusColorSchema,
  is_verified: z.boolean().default(false),
  last_updated: z.string().datetime().optional().nullable()
});
export interface ParkingLot {
  id: string;
  owner_id?: string;
  name: string;
  latitude: number;
  longitude: number;
  camera_url?: string | null;
  slots_data: number[][];
  capacity: number;
  available_spots: number;
  status_color: ParkingLotStatusColor;
  is_verified: boolean;
  last_updated?: string | null;
}

export const DetectionPayloadSchema = z.object({
  lot_id: z.string().uuid(),
  detected_cars: z.number()
});
export interface DetectionPayload {
  lot_id: string;
  detected_cars: number;
}

export const CaptureFramePayloadSchema = z.object({
  camera_url: z.string()
});
export interface CaptureFramePayload {
  camera_url: string;
}
