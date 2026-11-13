import { z } from '../zod-shim.ts';

export const TransitVehicleTypeSchema = z.enum(['tram', 'bus', 'trolleybus'] as const);
export type TransitVehicleType = 'tram' | 'bus' | 'trolleybus';

export const LineOperationalStatusSchema = z.enum([
  'normal',
  'detoured',
  'suspended',
  'temporary_replacement'
] as const);
export type LineOperationalStatus = 'normal' | 'detoured' | 'suspended' | 'temporary_replacement';

export const TransitStopSchema = z.object({
  id: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  lines_served: z.array(z.string()),
  is_currently_closed: z.boolean().default(false),
  closure_reason: z.string().optional()
});
export interface TransitStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  lines_served: string[];
  is_currently_closed: boolean;
  closure_reason?: string;
}

export const DetourAlertSchema = z.object({
  id: z.string().uuid(),
  line_number: z.string(),
  title: z.string(),
  reason: z.string(),
  status: LineOperationalStatusSchema,
  affected_stops: z.array(z.string()),
  alternative_instructions: z.string(),
  replacement_line: z.string().optional().nullable(),
  valid_from: z.string().datetime(),
  valid_until: z.string().optional().nullable(),
  created_at: z.string().datetime()
});
export interface DetourAlert {
  id: string;
  line_number: string;
  title: string;
  reason: string;
  status: LineOperationalStatus;
  affected_stops: string[];
  alternative_instructions: string;
  replacement_line?: string | null;
  valid_from: string;
  valid_until?: string | null;
  created_at: string;
}

export const TransitLineSchema = z.object({
  id: z.string(),
  line_number: z.string(),
  type: TransitVehicleTypeSchema,
  name: z.string(),
  status: LineOperationalStatusSchema,
  current_route_summary: z.string(),
  detour_alert: DetourAlertSchema.optional().nullable()
});
export interface TransitLine {
  id: string;
  line_number: string;
  type: TransitVehicleType;
  name: string;
  status: LineOperationalStatus;
  current_route_summary: string;
  detour_alert?: DetourAlert | null;
}

export const CheckStopImpactRequestSchema = z.object({
  stop_name: z.string().optional(),
  stop_id: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});
export interface CheckStopImpactRequest {
  stop_name?: string;
  stop_id?: string;
  latitude?: number;
  longitude?: number;
}

export const CheckStopImpactResponseSchema = z.object({
  stop_name: z.string(),
  is_affected_by_detour: z.boolean(),
  active_alerts: z.array(DetourAlertSchema),
  available_lines: z.array(z.string()),
  suspended_lines: z.array(z.string()),
  guidance_message: z.string()
});
export interface CheckStopImpactResponse {
  stop_name: string;
  is_affected_by_detour: boolean;
  active_alerts: DetourAlert[];
  available_lines: string[];
  suspended_lines: string[];
  guidance_message: string;
}
