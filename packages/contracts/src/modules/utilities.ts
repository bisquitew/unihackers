import { z } from '../zod-shim.ts';

export const UtilityProviderSchema = z.enum([
  'colterm',
  'aquatim',
  'retele_electrice_banat',
  'delgaz_grid'
] as const);
export type UtilityProvider = 'colterm' | 'aquatim' | 'retele_electrice_banat' | 'delgaz_grid';

export const OutageTypeSchema = z.enum([
  'heating_and_hot_water',
  'hot_water_only',
  'cold_water',
  'electricity',
  'gas'
] as const);
export type OutageType = 'heating_and_hot_water' | 'hot_water_only' | 'cold_water' | 'electricity' | 'gas';

export const OutageStatusSchema = z.enum([
  'unplanned_breakdown',
  'scheduled_maintenance',
  'investigating',
  'resolved'
] as const);
export type OutageStatus = 'unplanned_breakdown' | 'scheduled_maintenance' | 'investigating' | 'resolved';

export const OutageSeveritySchema = z.enum(['low', 'medium', 'high', 'critical'] as const);
export type OutageSeverity = 'low' | 'medium' | 'high' | 'critical';

export const OutageSchema = z.object({
  id: z.string().uuid(),
  provider: UtilityProviderSchema,
  type: OutageTypeSchema,
  status: OutageStatusSchema,
  severity: OutageSeveritySchema.default('medium'),
  title: z.string(),
  description: z.string(),
  affected_areas: z.array(z.string()),
  affected_streets: z.array(z.string()).default([]),
  start_time: z.string().datetime(),
  estimated_restore_time: z.string().datetime().optional().nullable(),
  resolved_at: z.string().datetime().optional().nullable(),
  source_url: z.string().url().optional(),
  crowd_confirmations_count: z.number().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export interface Outage {
  id: string;
  provider: UtilityProvider;
  type: OutageType;
  status: OutageStatus;
  severity: OutageSeverity;
  title: string;
  description: string;
  affected_areas: string[];
  affected_streets: string[];
  start_time: string;
  estimated_restore_time?: string | null;
  resolved_at?: string | null;
  source_url?: string;
  crowd_confirmations_count: number;
  created_at: string;
  updated_at: string;
}

export const OutageCreatePayloadSchema = z.object({
  provider: UtilityProviderSchema,
  type: OutageTypeSchema,
  status: OutageStatusSchema.default('unplanned_breakdown'),
  severity: OutageSeveritySchema.default('medium'),
  title: z.string(),
  description: z.string(),
  affected_areas: z.array(z.string()),
  affected_streets: z.array(z.string()).optional().default([]),
  start_time: z.string().datetime().optional(),
  estimated_restore_time: z.string().datetime().optional().nullable(),
  source_url: z.string().url().optional()
});

export interface OutageCreatePayload {
  provider: UtilityProvider;
  type: OutageType;
  status?: OutageStatus;
  severity?: OutageSeverity;
  title: string;
  description: string;
  affected_areas: string[];
  affected_streets?: string[];
  start_time?: string;
  estimated_restore_time?: string | null;
  source_url?: string;
}

export const CheckAddressImpactRequestSchema = z.object({
  address: z.string().optional(),
  area: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});
export interface CheckAddressImpactRequest {
  address?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
}

export const CheckAddressImpactResponseSchema = z.object({
  is_affected: z.boolean(),
  active_outages: z.array(OutageSchema),
  message: z.string()
});
export interface CheckAddressImpactResponse {
  is_affected: boolean;
  active_outages: Outage[];
  message: string;
}

export const CrowdConfirmOutageSchema = z.object({
  outage_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  note: z.string().optional()
});
export interface CrowdConfirmOutage {
  outage_id: string;
  user_id?: string;
  note?: string;
}
