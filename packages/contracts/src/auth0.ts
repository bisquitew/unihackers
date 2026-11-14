import { z } from './zod-shim.ts';
import type { UserRole } from './core.ts';

export const SecurityTierSchema = z.enum([
  'tier_1_standard',
  'tier_2_mfa_verified',
  'tier_3_ai_agent_m2m'
] as const);
export type SecurityTier = 'tier_1_standard' | 'tier_2_mfa_verified' | 'tier_3_ai_agent_m2m';

export const AuthUserSchema = z.object({
  sub: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['resident', 'organizer', 'moderator', 'admin'] as const),
  permissions: z.array(z.string()),
  mfa_enabled: z.boolean(),
  mfa_verified: z.boolean(),
  amr: z.array(z.string()),
  idp: z.string(),
  is_ai_agent: z.boolean().optional(),
  security_tier: SecurityTierSchema
});
export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  mfa_enabled: boolean;
  mfa_verified: boolean;
  amr: string[];
  idp: string;
  is_ai_agent?: boolean;
  security_tier: SecurityTier;
}

export const MfaStepUpChallengeSchema = z.object({
  error: z.literal('mfa_required'),
  error_description: z.string(),
  required_role: z.string(),
  current_amr: z.array(z.string()),
  supported_mfa_factors: z.array(z.string()),
  auth0_step_up_prompt: z.string(),
  auth0_authorize_url: z.string()
});
export interface MfaStepUpChallenge {
  error: 'mfa_required';
  error_description: string;
  required_role: string;
  current_amr: string[];
  supported_mfa_factors: string[];
  auth0_step_up_prompt: string;
  auth0_authorize_url: string;
}

export const AuthAuditRecordSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  sub: z.string(),
  email: z.string(),
  role: z.string(),
  action: z.string(),
  outcome: z.enum(['ALLOW', 'CHALLENGE_MFA_REQUIRED', 'DENIED_INSUFFICIENT_ROLE', 'CHALLENGE_NEW_LOCATION_ALERT'] as const),
  mfa_verified: z.boolean(),
  amr: z.array(z.string()),
  ip: z.string().optional()
});
export interface AuthAuditRecord {
  id: string;
  timestamp: string;
  sub: string;
  email: string;
  role: string;
  action: string;
  outcome: 'ALLOW' | 'CHALLENGE_MFA_REQUIRED' | 'DENIED_INSUFFICIENT_ROLE' | 'CHALLENGE_NEW_LOCATION_ALERT';
  mfa_verified: boolean;
  amr: string[];
  ip?: string;
}

export const LoginLocationInfoSchema = z.object({
  city: z.string(),
  country: z.string(),
  area_name: z.string().optional(),
  ip: z.string(),
  device: z.string().optional(),
  is_trusted: z.boolean().default(false)
});
export interface LoginLocationInfo {
  city: string;
  country: string;
  area_name?: string;
  ip: string;
  device?: string;
  is_trusted?: boolean;
}

export const SecurityEmailAlertSchema = z.object({
  id: z.string(),
  to_email: z.string(),
  user_name: z.string(),
  subject: z.string(),
  body_text: z.string(),
  body_html: z.string(),
  location: LoginLocationInfoSchema,
  alert_type: z.enum(['new_location', 'suspicious_ip', 'step_up_prompt'] as const),
  confirm_url: z.string(),
  block_url: z.string(),
  sent_at: z.string()
});
export interface SecurityEmailAlert {
  id: string;
  to_email: string;
  user_name: string;
  subject: string;
  body_text: string;
  body_html: string;
  location: LoginLocationInfo;
  alert_type: 'new_location' | 'suspicious_ip' | 'step_up_prompt';
  confirm_url: string;
  block_url: string;
  sent_at: string;
}

export const DevTokenInfoSchema = z.object({
  token: z.string(),
  label: z.string(),
  role: z.string(),
  mfa_verified: z.boolean(),
  description: z.string(),
  example_header: z.string()
});
export interface DevTokenInfo {
  token: string;
  label: string;
  role: string;
  mfa_verified: boolean;
  description: string;
  example_header: string;
}
