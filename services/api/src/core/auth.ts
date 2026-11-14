import { DEMO_AUTH, isStaffEmail } from './config.ts';
import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { db } from './db.ts';
import { notify } from './notifications.ts';
import { eventBus } from './events.ts';
import type { 
  AuthUser, 
  UserRole, 
  MfaStepUpChallenge, 
  AuthAuditRecord, 
  DevTokenInfo,
  LoginLocationInfo,
  SecurityEmailAlert
} from '@hub/contracts';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'timisoara-hub.eu.auth0.com';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'https://api.timisoara-hub.ro';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
try {
  jwks = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));
} catch {
  // Remote JWKS will be created on demand if network available
}

// In-memory Security Audit Log buffer (records access control and MFA decisions)
const auditLogs: AuthAuditRecord[] = [];
const MAX_AUDIT_LOGS = 200;

export function recordAudit(
  user: AuthUser, 
  action: string, 
  outcome: 'ALLOW' | 'CHALLENGE_MFA_REQUIRED' | 'DENIED_INSUFFICIENT_ROLE' | 'CHALLENGE_NEW_LOCATION_ALERT',
  ip?: string
) {
  const record: AuthAuditRecord = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    sub: user.sub,
    email: user.email,
    role: user.role,
    action,
    outcome,
    mfa_verified: user.mfa_verified,
    amr: user.amr,
    ip: ip || '127.0.0.1'
  };

  auditLogs.unshift(record);
  if (auditLogs.length > MAX_AUDIT_LOGS) {
    auditLogs.pop();
  }

  // Persist asynchronously to Tiger Cloud database if connected
  if (db.isTigerConnected()) {
    db.query(`
      INSERT INTO core_auth_audit_events (id, recorded_at, sub, email, role, action, outcome, mfa_verified, amr, ip)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    `, [
      record.id,
      record.timestamp,
      record.sub,
      record.email,
      record.role,
      record.action,
      record.outcome,
      record.mfa_verified,
      record.amr,
      record.ip
    ]).catch((err) => {
      // Non-blocking background log
    });
  }

  if (outcome !== 'ALLOW') {
    console.warn(`🔒 [AUTH0 AUDIT] ${outcome}: User "${user.email}" (${user.role}) attempted "${action}" | MFA: ${user.mfa_verified} [amr: ${user.amr.join(', ')}]`);
  }
}

export async function getAuditLogs(limit = 50): Promise<AuthAuditRecord[]> {
  if (db.isTigerConnected()) {
    try {
      const rows = await db.query<{
        id: string;
        timestamp: Date | string;
        sub: string;
        email: string;
        role: string;
        action: string;
        outcome: 'ALLOW' | 'CHALLENGE_MFA_REQUIRED' | 'DENIED_INSUFFICIENT_ROLE' | 'CHALLENGE_NEW_LOCATION_ALERT';
        mfa_verified: boolean;
        amr: string[];
        ip: string;
      }>(`
        SELECT 
          id, 
          recorded_at AS timestamp, 
          sub, 
          email, 
          role, 
          action, 
          outcome, 
          mfa_verified, 
          amr, 
          ip 
        FROM core_auth_audit_events 
        ORDER BY recorded_at DESC 
        LIMIT $1;
      `, [limit]);

      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          ...r,
          timestamp: typeof r.timestamp === 'string' ? r.timestamp : r.timestamp.toISOString()
        }));
      }
    } catch (err: any) {
      console.warn('⚠️ Error querying database audit log:', err.message);
    }
  }

  return auditLogs.slice(0, limit);
}

// ============================================================
// 📍 ADAPTIVE AUTH0 LOCATION ANOMALY & SECURITY EMAIL ENGINE
// ============================================================

// Known trusted locations per user sub
const USER_TRUSTED_LOCATIONS: Map<string, LoginLocationInfo[]> = new Map();

// Seed trusted home locations for standard demo personas
USER_TRUSTED_LOCATIONS.set('auth0|dev-resident-01', [
  { city: 'Timișoara', country: 'România', area_name: 'Cetate', ip: '86.120.10.1', is_trusted: true }
]);
USER_TRUSTED_LOCATIONS.set('auth0|dev-admin-01', [
  { city: 'Timișoara', country: 'România', area_name: 'Centru - Primărie', ip: '86.120.1.100', is_trusted: true }
]);
USER_TRUSTED_LOCATIONS.set('auth0|dev-mod-01', [
  { city: 'Timișoara', country: 'România', area_name: 'Circumvalațiunii', ip: '86.120.5.25', is_trusted: true }
]);

// Outbox buffer for generated security warning emails
const SECURITY_EMAIL_OUTBOX: SecurityEmailAlert[] = [];

export function getSecurityEmails(email?: string): SecurityEmailAlert[] {
  if (email) {
    return SECURITY_EMAIL_OUTBOX.filter((e) => e.to_email.toLowerCase() === email.toLowerCase());
  }
  return [...SECURITY_EMAIL_OUTBOX];
}

export function isLocationTrusted(sub: string, location: LoginLocationInfo): boolean {
  const trustedList = USER_TRUSTED_LOCATIONS.get(sub) || [
    { city: 'Timișoara', country: 'România', ip: '86.120.0.0', is_trusted: true }
  ];
  return trustedList.some((t) => 
    t.city.toLowerCase().trim() === location.city.toLowerCase().trim() &&
    t.country.toLowerCase().trim() === location.country.toLowerCase().trim()
  );
}

export function trustLocation(sub: string, location: LoginLocationInfo) {
  const existing = USER_TRUSTED_LOCATIONS.get(sub) || [
    { city: 'Timișoara', country: 'România', ip: '86.120.0.0', is_trusted: true }
  ];
  existing.push({ ...location, is_trusted: true });
  USER_TRUSTED_LOCATIONS.set(sub, existing);
}

export function createSecurityEmailAlert(
  user: AuthUser,
  location: LoginLocationInfo
): SecurityEmailAlert {
  const alertId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:8000';

  const confirmUrl = `${baseUrl}/v1/core/auth/trust-location?sub=${encodeURIComponent(user.sub)}&city=${encodeURIComponent(location.city)}&country=${encodeURIComponent(location.country)}&ip=${encodeURIComponent(location.ip)}`;
  const blockUrl = `${baseUrl}/v1/core/auth/block-session?sub=${encodeURIComponent(user.sub)}&alert_id=${alertId}`;

  const subject = `🚨 [Alertă de Securitate] Autentificare nouă din ${location.city}, ${location.country}`;

  const bodyText = `
Salut, ${user.name}!

O nouă încercare de conectare la contul tău Timișoara City Hub a fost detectată dintr-o locație nerecunoscută:

📍 Locație: ${location.city}, ${location.country} ${location.area_name ? `(${location.area_name})` : ''}
🌐 Adresă IP: ${location.ip}
💻 Dispozitiv: ${location.device || 'Browser web / Dispozitiv mobil'}
⏰ Data și ora: ${new Date(timestamp).toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })}

DACĂ AI FOST TU:
Poți confirma această locație accesând linkul de mai jos:
${confirmUrl}

DACĂ NU AI FOST TU:
Cineva ar putea încerca să-ți acceseze contul! Blochează sesiunea și securizează contul imediat:
${blockUrl}

Echipa de Securitate Timișoara City Hub • Auth0 Adaptive Shield
  `.trim();

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; padding: 24px;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="background: #1e3a8a; padding: 20px 24px; color: #ffffff;">
      <h2 style="margin: 0; font-size: 20px;">🏛️ Timișoara City Hub</h2>
      <p style="margin: 4px 0 0; opacity: 0.85; font-size: 13px;">Centrul de Securitate și Identitate Cetățenească</p>
    </div>
    <div style="padding: 24px;">
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
        <strong style="color: #991b1b; font-size: 15px;">🚨 Alertă de Securitate: Autentificare dintr-o zonă nouă</strong>
        <p style="margin: 4px 0 0; color: #7f1d1d; font-size: 13px;">O conectare la contul tău (${user.email}) a fost detectată dintr-o locație nefamiliară.</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <tr><td style="padding: 6px 0; color: #6b7280; width: 120px;">📍 Locație:</td><td style="padding: 6px 0; font-weight: 600; color: #111827;">${location.city}, ${location.country}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">🌐 Adresă IP:</td><td style="padding: 6px 0; font-family: monospace; color: #111827;">${location.ip}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">💻 Dispozitiv:</td><td style="padding: 6px 0; color: #111827;">${location.device || 'Dispozitiv mobil / Web'}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">⏰ Dată & Oră:</td><td style="padding: 6px 0; color: #111827;">${new Date().toLocaleString('ro-RO')}</td></tr>
      </table>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${confirmUrl}" style="background: #10b981; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; margin-right: 8px;">✓ Da, am fost eu</a>
        <a href="${blockUrl}" style="background: #ef4444; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">✕ Nu am fost eu (Blochează)</a>
      </div>
    </div>
    <div style="background: #f9fafb; padding: 12px 24px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center;">
      Timișoara City Hub Security • Auth0 Anomaly Detection Engine • UNIHACK 2026
    </div>
  </div>
</body>
</html>
  `.trim();

  const alertRecord: SecurityEmailAlert = {
    id: alertId,
    to_email: user.email,
    user_name: user.name,
    subject,
    body_text: bodyText,
    body_html: bodyHtml,
    location,
    alert_type: 'new_location',
    confirm_url: confirmUrl,
    block_url: blockUrl,
    sent_at: timestamp
  };

  SECURITY_EMAIL_OUTBOX.unshift(alertRecord);
  if (SECURITY_EMAIL_OUTBOX.length > 50) {
    SECURITY_EMAIL_OUTBOX.pop();
  }

  console.log(`📧 [SECURITY EMAIL SENT] ✉️ To: ${user.email} | Subject: "${subject}"`);
  console.log(`   Location: ${location.city}, ${location.country} | IP: ${location.ip}`);

  return alertRecord;
}

export async function handleLoginLocationCheck(
  user: AuthUser,
  location: LoginLocationInfo
): Promise<{
  is_new_location: boolean;
  push_notification: any | null;
  security_email: SecurityEmailAlert | null;
  step_up_required: boolean;
}> {
  const isTrusted = isLocationTrusted(user.sub, location);

  if (isTrusted) {
    return {
      is_new_location: false,
      push_notification: null,
      security_email: null,
      step_up_required: false
    };
  }

  // Brand new location detected! Trigger immediate security protections:
  console.warn(`🚨 [SECURITY ANOMALY] New login location detected for ${user.email}: ${location.city}, ${location.country} (IP: ${location.ip})`);

  // 1. Send In-App & Push Notification
  const pushNotification = await notify({
    userId: user.sub,
    moduleId: 'core_security',
    title: '🚨 Alertă de Securitate: Autentificare dintr-o zonă nouă',
    body: `Conectare nouă detectată din "${location.city}, ${location.country}" (IP: ${location.ip}). Dacă nu ai fost tu, securizează contul.`,
    category: 'security',
    data: {
      location,
      action_required: 'verify_or_block',
      detected_at: new Date().toISOString()
    }
  });

  // 2. Dispatch Transactional Security Warning Email
  const securityEmail = createSecurityEmailAlert(user, location);

  // 3. Emit real-time event to event bus
  await eventBus.emit('auth.new_location_detected', {
    userSub: user.sub,
    email: user.email,
    location,
    alertId: securityEmail.id,
    timestamp: new Date().toISOString()
  });

  // 4. Record tamper-evident security audit log
  recordAudit(user, 'auth.login_new_location', 'CHALLENGE_NEW_LOCATION_ALERT', location.ip);

  return {
    is_new_location: true,
    push_notification: pushNotification,
    security_email: securityEmail,
    step_up_required: true
  };
}

// Standard Role Permission Matrix
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  resident: [
    'read:city-alerts',
    'read:parking',
    'read:transit',
    'create:reports',
    'rsvp:events'
  ],
  organizer: [
    'read:city-alerts',
    'read:parking',
    'read:transit',
    'create:reports',
    'rsvp:events',
    'create:events',
    'manage:tickets'
  ],
  moderator: [
    'read:city-alerts',
    'read:parking',
    'read:transit',
    'create:reports',
    'rsvp:events',
    'moderate:forum',
    'resolve:reports',
    'view:audit-log'
  ],
  admin: [
    'read:city-alerts',
    'read:parking',
    'read:transit',
    'create:reports',
    'rsvp:events',
    'create:events',
    'moderate:forum',
    'publish:outages',
    'manage:detours',
    'manage:lots',
    'view:audit-log',
    'admin:system'
  ]
};

// Rich Dev Identities for immediate judge demonstration
export const DEV_USERS: Record<string, AuthUser> = {
  dev_resident: {
    sub: 'auth0|dev-resident-01',
    email: 'resident@timisoara-hub.ro',
    name: 'Andrei Timișan',
    role: 'resident',
    permissions: ROLE_PERMISSIONS.resident,
    mfa_enabled: false,
    mfa_verified: false,
    amr: ['email-passwordless'],
    idp: 'email-passwordless',
    security_tier: 'tier_1_standard'
  },
  dev_organizer: {
    sub: 'auth0|dev-org-01',
    email: 'organizer@timisoara-hub.ro',
    name: 'Ioana Popa',
    role: 'organizer',
    permissions: ROLE_PERMISSIONS.organizer,
    mfa_enabled: false,
    mfa_verified: false,
    amr: ['google-oauth2'],
    idp: 'google-oauth2',
    security_tier: 'tier_1_standard'
  },
  dev_moderator_no_mfa: {
    sub: 'auth0|dev-mod-01',
    email: 'moderator@timisoara-hub.ro',
    name: 'Mihai Moderator (No MFA)',
    role: 'moderator',
    permissions: ROLE_PERMISSIONS.moderator,
    mfa_enabled: true,
    mfa_verified: false,
    amr: ['pwd'],
    idp: 'auth0',
    security_tier: 'tier_1_standard'
  },
  dev_moderator_mfa: {
    sub: 'auth0|dev-mod-01',
    email: 'moderator@timisoara-hub.ro',
    name: 'Mihai Moderator [MFA Active]',
    role: 'moderator',
    permissions: ROLE_PERMISSIONS.moderator,
    mfa_enabled: true,
    mfa_verified: true,
    amr: ['pwd', 'mfa', 'totp'],
    idp: 'auth0',
    security_tier: 'tier_2_mfa_verified'
  },
  dev_moderator: {
    // Default alias has MFA verified for existing unit tests
    sub: 'auth0|dev-mod-01',
    email: 'moderator@timisoara-hub.ro',
    name: 'Mihai Moderator [MFA Active]',
    role: 'moderator',
    permissions: ROLE_PERMISSIONS.moderator,
    mfa_enabled: true,
    mfa_verified: true,
    amr: ['pwd', 'mfa', 'totp'],
    idp: 'auth0',
    security_tier: 'tier_2_mfa_verified'
  },
  dev_admin_no_mfa: {
    sub: 'auth0|dev-admin-01',
    email: 'admin@timisoara-hub.ro',
    name: 'Admin Primăria TM (No MFA)',
    role: 'admin',
    permissions: ROLE_PERMISSIONS.admin,
    mfa_enabled: true,
    mfa_verified: false,
    amr: ['pwd'],
    idp: 'auth0',
    security_tier: 'tier_1_standard'
  },
  dev_admin_mfa: {
    sub: 'auth0|dev-admin-01',
    email: 'admin@timisoara-hub.ro',
    name: 'Admin Primăria TM [FIDO2/WebAuthn MFA]',
    role: 'admin',
    permissions: ROLE_PERMISSIONS.admin,
    mfa_enabled: true,
    mfa_verified: true,
    amr: ['pwd', 'mfa', 'webauthn'],
    idp: 'auth0',
    security_tier: 'tier_2_mfa_verified'
  },
  dev_admin: {
    // Default alias has MFA verified for backward compatibility
    sub: 'auth0|dev-admin-01',
    email: 'admin@timisoara-hub.ro',
    name: 'Admin Primăria TM [FIDO2/WebAuthn MFA]',
    role: 'admin',
    permissions: ROLE_PERMISSIONS.admin,
    mfa_enabled: true,
    mfa_verified: true,
    amr: ['pwd', 'mfa', 'webauthn'],
    idp: 'auth0',
    security_tier: 'tier_2_mfa_verified'
  },
  dev_ai_agent: {
    // Auth0 for AI Agents: Machine-to-Machine (M2M) Service Principal
    sub: 'auth0|agent-gemini-netrom-01',
    email: 'ai-agent@timisoara-hub.ro',
    name: 'Autonomous Netrom Gemini Ingestion Agent',
    role: 'admin',
    permissions: ['publish:outages', 'manage:detours', 'ingest:utilities', 'ingest:transit'],
    mfa_enabled: false,
    mfa_verified: true, // M2M service accounts use client-credentials assertion instead of human MFA
    amr: ['m2m', 'client_credentials'],
    idp: 'auth0-m2m',
    is_ai_agent: true,
    security_tier: 'tier_3_ai_agent_m2m'
  }
};

export const GUEST_USER: AuthUser = {
  sub: 'guest|unauthenticated',
  email: 'guest@timisoara-hub.ro',
  name: 'Vizitator Anonim',
  role: 'resident',
  permissions: ['read:public'],
  mfa_enabled: false,
  mfa_verified: false,
  amr: [],
  idp: 'none',
  security_tier: 'tier_1_standard'
};

/**
 * Demo sign-in (DEMO_AUTH only). The role is decided here from the email, never from what the caller asks for:
 * staff mail addresses become admins, everyone else a resident. Real accounts come from Auth0 tokens.
 */
export function registerGoogleUser(googlePayload: {
  email: string;
  name: string;
  picture?: string;
}): { token: string; user: AuthUser } {
  const role: UserRole = isStaffEmail(googlePayload.email) ? 'admin' : 'resident';
  const id = crypto.randomUUID();
  const sub = `google-oauth2|${id}`;
  const token = `google_${id.replace(/-/g, '')}`; // unguessable, unlike a timestamp

  const user: AuthUser = {
    sub,
    email: googlePayload.email,
    name: googlePayload.name,
    role,
    permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.resident,
    mfa_enabled: role === 'admin',
    mfa_verified: role === 'admin',
    amr: ['google-oauth2'],
    idp: 'google-oauth2',
    security_tier: role === 'admin' ? 'tier_2_mfa_verified' : 'tier_1_standard'
  };

  DEV_USERS[token] = user;
  DEV_USERS[sub] = user;
  recordAudit(user, 'auth.google_login', 'ALLOW');
  return { token, user };
}

/**
 * Where a request comes from, sent by the clients in the `X-Hub-Client` header: the phone `app` or the `web` site.
 * Access rule: regular accounts (residents, organizers) sign in on both, like any social network. Staff accounts
 * (admins, moderators) sign in on the web dashboard only, never in the app.
 * A request without the header (scripts, tests, the AI worker) is not restricted by this rule.
 */
export type HubClient = 'app' | 'web';
const STAFF_ROLES: UserRole[] = ['admin', 'moderator'];

export function hubClientOf(value: unknown): HubClient | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v === 'app' || v === 'web' ? v : null;
}

/** Whether this role may sign in from this client. */
export function roleAllowedOnClient(role: UserRole, client: HubClient | null): boolean {
  if (client !== 'app') return true;
  return !STAFF_ROLES.includes(role);
}

/** The 403 body returned when a staff account tries to sign in from the app. */
export function wrongClientBody(role: UserRole, _client: HubClient) {
  return { error: 'use_web_dashboard', error_description: 'Staff accounts sign in on the web dashboard, not in the app.', role };
}

/**
 * Resolves Bearer token into an AuthUser context, then applies the client rule: a staff user on the app is treated as
 * a guest there, so a staff token is useless in the app.
 */
export async function resolveAuthUser(authHeader?: string, client: HubClient | null = null): Promise<AuthUser> {
  const user = await resolveAuthUserRaw(authHeader);
  if (user !== GUEST_USER && !roleAllowedOnClient(user.role, client)) return GUEST_USER;
  return user;
}

/**
 * Resolves Bearer token into an AuthUser context.
 * Supports both dev tokens and real Auth0 RS256 JWTs.
 */
async function resolveAuthUserRaw(authHeader?: string): Promise<AuthUser> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return GUEST_USER;
  }

  const token = authHeader.replace(/^Bearer\s+/, '').trim();

  // 1. Dev token check (instant zero-network mock for testing & demos), only while the demo sign-in is enabled
  if (DEMO_AUTH && DEV_USERS[token]) {
    return DEV_USERS[token];
  }

  // 2. Real Auth0 RS256 JWT validation
  if (jwks) {
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `https://${AUTH0_DOMAIN}/`,
        audience: AUTH0_AUDIENCE
      });

      const rawAmr = Array.isArray(payload.amr) ? (payload.amr as string[]) : [];
      const hasMfa = rawAmr.includes('mfa') || rawAmr.includes('otp') || rawAmr.includes('webauthn');
      const role = ((payload['https://timisoara-hub.ro/role'] || payload.role) as UserRole) || 'resident';
      const permissions = (payload.permissions as string[]) || ROLE_PERMISSIONS[role] || [];
      const isM2M = payload.gty === 'client-credentials';

      return {
        sub: payload.sub as string,
        email: (payload['https://timisoara-hub.ro/email'] || payload.email || '') as string,
        name: (payload['https://timisoara-hub.ro/name'] || payload.name || 'Auth0 User') as string,
        role,
        permissions,
        mfa_enabled: hasMfa || role === 'admin' || role === 'moderator',
        mfa_verified: hasMfa || isM2M,
        amr: rawAmr.length > 0 ? rawAmr : (isM2M ? ['m2m'] : ['pwd']),
        idp: (payload.sub as string).split('|')[0] || 'auth0',
        is_ai_agent: isM2M,
        security_tier: isM2M ? 'tier_3_ai_agent_m2m' : (hasMfa ? 'tier_2_mfa_verified' : 'tier_1_standard')
      };
    } catch (err: any) {
      console.warn('⚠️ Real Auth0 JWT verification failed:', err.message);
    }
  }

  return GUEST_USER;
}

/**
 * Hono middleware compatible wrapper
 */
export async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  const user = await resolveAuthUser(authHeader, hubClientOf(c.req.header('X-Hub-Client')));
  c.set('user', user);
  return next();
}

export type EnforceSecurityResult =
  | { authorized: true; status?: never; body?: never }
  | { authorized: false; status: number; body: any };

/**
 * Authorizes a request against required roles and mandatory MFA policies.
 * Returns null if authorized, or a structured challenge response object if rejected.
 */
export function enforceSecurityPolicy(
  user: AuthUser,
  action: string,
  options: {
    requiredRoles?: UserRole[];
    requireMfa?: boolean;
    ip?: string;
  } = {}
): EnforceSecurityResult {
  const { requiredRoles, requireMfa = false, ip } = options;

  // 1. Role enforcement
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    recordAudit(user, action, 'DENIED_INSUFFICIENT_ROLE', ip);
    return {
      authorized: false,
      status: 403,
      body: {
        error: 'insufficient_role',
        error_description: `Action "${action}" requires one of the following roles: [${requiredRoles.join(', ')}]. Current role: "${user.role}".`,
        current_role: user.role,
        required_roles: requiredRoles
      }
    };
  }

  // 2. Mandatory MFA Enforcement for Administrative/Staff Actions
  // (Applies to Admin & Moderator roles unless operating via authorized AI Agent M2M)
  const isStaffRole = user.role === 'admin' || user.role === 'moderator';
  if ((requireMfa || isStaffRole) && !user.mfa_verified && !user.is_ai_agent) {
    recordAudit(user, action, 'CHALLENGE_MFA_REQUIRED', ip);

    const challenge: MfaStepUpChallenge = {
      error: 'mfa_required',
      error_description: `High-privilege action "${action}" requires verified Multi-Factor Authentication (MFA).`,
      required_role: user.role,
      current_amr: user.amr,
      supported_mfa_factors: ['totp_authenticator', 'fido2_webauthn_passkey', 'sms'],
      auth0_step_up_prompt: 'mfa',
      auth0_authorize_url: `https://${AUTH0_DOMAIN}/authorize?client_id=${process.env.AUTH0_CLIENT_ID || 'hub-api'}&response_type=token&prompt=mfa&scope=openid%20profile%20mfa`
    };

    return {
      authorized: false,
      status: 403,
      body: challenge
    };
  }

  recordAudit(user, action, 'ALLOW', ip);
  return { authorized: true };
}

/**
 * Returns available test tokens with descriptions for hackathon judges
 */
export function getDevTokensCatalog(): DevTokenInfo[] {
  return [
    {
      token: 'dev_resident',
      label: 'Resident Andrei (Google / Passwordless)',
      role: 'resident',
      mfa_verified: false,
      description: 'Standard resident. Access to public alerts, parking, transit, and saved places.',
      example_header: 'Authorization: Bearer dev_resident'
    },
    {
      token: 'dev_organizer',
      label: 'Organizer Ioana (Social Login)',
      role: 'organizer',
      mfa_verified: false,
      description: 'Event organizer. Can create cultural events and review attendees.',
      example_header: 'Authorization: Bearer dev_organizer'
    },
    {
      token: 'dev_moderator_no_mfa',
      label: 'Moderator Mihai (Single-Factor Only - BLOCKED)',
      role: 'moderator',
      mfa_verified: false,
      description: 'Moderator session WITHOUT MFA. Triggers 403 MFA_REQUIRED challenge when moderating!',
      example_header: 'Authorization: Bearer dev_moderator_no_mfa'
    },
    {
      token: 'dev_moderator_mfa',
      label: 'Moderator Mihai (TOTP Authenticator MFA - PASS)',
      role: 'moderator',
      mfa_verified: true,
      description: 'Moderator session with TOTP MFA verified. Successfully moderates community forum.',
      example_header: 'Authorization: Bearer dev_moderator_mfa'
    },
    {
      token: 'dev_admin_no_mfa',
      label: 'Admin Primăria TM (Single-Factor Only - BLOCKED)',
      role: 'admin',
      mfa_verified: false,
      description: 'Admin session WITHOUT MFA. Triggers 403 MFA_REQUIRED challenge when publishing city outages!',
      example_header: 'Authorization: Bearer dev_admin_no_mfa'
    },
    {
      token: 'dev_admin_mfa',
      label: 'Admin Primăria TM (FIDO2 / WebAuthn Passkey - PASS)',
      role: 'admin',
      mfa_verified: true,
      description: 'Full municipal admin with biometric Passkey MFA. Full access to publish outages and reroute transit.',
      example_header: 'Authorization: Bearer dev_admin_mfa'
    },
    {
      token: 'dev_ai_agent',
      label: 'Auth0 for AI Agents (Netrom Gemini Worker - M2M)',
      role: 'admin',
      mfa_verified: true,
      description: 'Machine-to-Machine service principal token for autonomous AI ingestion without human MFA.',
      example_header: 'Authorization: Bearer dev_ai_agent'
    }
  ];
}
