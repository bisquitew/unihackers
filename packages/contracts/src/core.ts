import { z } from './zod-shim';

// Roles required by Auth0 & System (Section 3 & 4)
export const UserRoleSchema = z.enum([
  'resident',
  'organizer',
  'moderator',
  'admin'
] as const);
export type UserRole = 'resident' | 'organizer' | 'moderator' | 'admin';

export const UserSchema = z.object({
  id: z.string().uuid(),
  auth0_id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema.default('resident'),
  neighbourhood: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});
export interface User {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
  role: UserRole;
  neighbourhood?: string;
  created_at: string;
  updated_at: string;
}

// Pre-defined Timișoara neighbourhoods
export const TimisoaraAreaNameSchema = z.enum([
  'Cetate',
  'Circumvalatiunii',
  'Complex Studentesc',
  'Iosefin',
  'Elisabetin',
  'Fabric',
  'Soarelui',
  'Girocului',
  'Dambovita',
  'Mehala',
  'Calea Aradului',
  'Calea Lipovei',
  'Bucovina',
  'Freidorf',
  'Gara de Nord',
  'Plopi'
] as const);
export type TimisoaraAreaName = string;

export const AreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  center_lat: z.number(),
  center_lng: z.number(),
  radius_meters: z.number().default(1500)
});
export interface Area {
  id: string;
  name: string;
  slug: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
}

export const SavedPlaceSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  label: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  area_id: z.string().optional(),
  notify_utilities: z.boolean().default(true),
  notify_transit: z.boolean().default(true)
});
export interface SavedPlace {
  id: string;
  user_id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  area_id?: string;
  notify_utilities: boolean;
  notify_transit: boolean;
}

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  module_id: z.string(),
  title: z.string(),
  body: z.string(),
  category: z.enum(['outage', 'transit_detour', 'smell_alert', 'safety', 'system'] as const),
  data: z.record(z.any()).optional(),
  read: z.boolean().default(false),
  created_at: z.string().datetime()
});
export interface Notification {
  id: string;
  user_id: string;
  module_id: string;
  title: string;
  body: string;
  category: 'outage' | 'transit_detour' | 'smell_alert' | 'safety' | 'system';
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export const FeatureFlagStatusSchema = z.enum(['draft', 'beta', 'live'] as const);
export type FeatureFlagStatus = 'draft' | 'beta' | 'live';

export const FeatureFlagSchema = z.object({
  module_id: z.string(),
  status: FeatureFlagStatusSchema,
  enabled: z.boolean(),
  min_role: UserRoleSchema.default('resident')
});
export interface FeatureFlag {
  module_id: string;
  status: FeatureFlagStatus;
  enabled: boolean;
  min_role: UserRole;
}

export const CoreEventSchema = z.object({
  id: z.string().uuid(),
  topic: z.string(),
  payload: z.record(z.any()),
  created_at: z.string().datetime()
});
export interface CoreEvent {
  id: string;
  topic: string;
  payload: Record<string, any>;
  created_at: string;
}

// Photo Upload Service (Vultr Object Storage / S3 signed URLs)
export const UploadRequestSchema = z.object({
  filename: z.string(),
  content_type: z.string(),
  module_id: z.string().default('general')
});
export interface UploadRequestPayload {
  filename: string;
  content_type: string;
  module_id?: string;
}

export const UploadSignedUrlResponseSchema = z.object({
  upload_url: z.string(),
  public_url: z.string(),
  key: z.string(),
  expires_in: z.number()
});
export interface UploadSignedUrlResponse {
  upload_url: string;
  public_url: string;
  key: string;
  expires_in: number;
}
