import React, { createContext, useContext, useState } from 'react';
import type { UserRole, AuthUser as ContractAuthUser, SecurityTier } from '@hub/contracts';

export interface AuthUser {
  id: string;
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  mfa_enabled: boolean;
  mfa_verified: boolean;
  amr: string[];
  idp: string;
  security_tier: SecurityTier;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (tokenOrRole?: string) => Promise<void>;
  simulateMfaStepUp: (factor?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const DEFAULT_RESIDENT: AuthUser = {
  id: 'usr-resident-01',
  sub: 'auth0|dev-resident-01',
  email: 'resident@timisoara-hub.ro',
  name: 'Andrei Timișan',
  role: 'resident',
  permissions: ['read:city-alerts', 'read:parking', 'read:transit', 'create:reports', 'rsvp:events'],
  mfa_enabled: false,
  mfa_verified: false,
  amr: ['email-passwordless'],
  idp: 'email-passwordless',
  security_tier: 'tier_1_standard'
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_RESIDENT,
  token: 'dev_resident',
  login: async () => {},
  simulateMfaStepUp: async () => false,
  logout: () => {},
  isLoading: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_RESIDENT);
  const [token, setToken] = useState<string | null>('dev_resident');
  const [isLoading, setIsLoading] = useState(false);

  // Dev login toggle for testing all roles, MFA tiers, and AI Agent identities
  const login = async (tokenOrRole: string = 'dev_resident') => {
    setIsLoading(true);

    const tokenProfiles: Record<string, { user: AuthUser; token: string }> = {
      dev_resident: {
        user: DEFAULT_RESIDENT,
        token: 'dev_resident'
      },
      dev_organizer: {
        user: {
          id: 'usr-organizer-01',
          sub: 'auth0|dev-org-01',
          email: 'organizer@timisoara-hub.ro',
          name: 'Ioana Popa',
          role: 'organizer',
          permissions: ['read:city-alerts', 'create:events', 'manage:tickets', 'rsvp:events'],
          mfa_enabled: false,
          mfa_verified: false,
          amr: ['google-oauth2'],
          idp: 'google-oauth2',
          security_tier: 'tier_1_standard'
        },
        token: 'dev_organizer'
      },
      dev_moderator_no_mfa: {
        user: {
          id: 'usr-mod-01',
          sub: 'auth0|dev-mod-01',
          email: 'moderator@timisoara-hub.ro',
          name: 'Mihai Moderator (No MFA)',
          role: 'moderator',
          permissions: ['read:city-alerts', 'moderate:forum', 'resolve:reports'],
          mfa_enabled: true,
          mfa_verified: false,
          amr: ['pwd'],
          idp: 'auth0',
          security_tier: 'tier_1_standard'
        },
        token: 'dev_moderator_no_mfa'
      },
      dev_moderator_mfa: {
        user: {
          id: 'usr-mod-01',
          sub: 'auth0|dev-mod-01',
          email: 'moderator@timisoara-hub.ro',
          name: 'Mihai Moderator [MFA Active]',
          role: 'moderator',
          permissions: ['read:city-alerts', 'moderate:forum', 'resolve:reports', 'view:audit-log'],
          mfa_enabled: true,
          mfa_verified: true,
          amr: ['pwd', 'mfa', 'totp'],
          idp: 'auth0',
          security_tier: 'tier_2_mfa_verified'
        },
        token: 'dev_moderator_mfa'
      },
      dev_admin_no_mfa: {
        user: {
          id: 'usr-admin-01',
          sub: 'auth0|dev-admin-01',
          email: 'admin@timisoara-hub.ro',
          name: 'Admin Primăria TM (No MFA)',
          role: 'admin',
          permissions: ['read:city-alerts', 'publish:outages', 'manage:detours'],
          mfa_enabled: true,
          mfa_verified: false,
          amr: ['pwd'],
          idp: 'auth0',
          security_tier: 'tier_1_standard'
        },
        token: 'dev_admin_no_mfa'
      },
      dev_admin_mfa: {
        user: {
          id: 'usr-admin-01',
          sub: 'auth0|dev-admin-01',
          email: 'admin@timisoara-hub.ro',
          name: 'Admin Primăria TM [FIDO2 Passkey MFA]',
          role: 'admin',
          permissions: ['read:city-alerts', 'publish:outages', 'manage:detours', 'view:audit-log', 'admin:system'],
          mfa_enabled: true,
          mfa_verified: true,
          amr: ['pwd', 'mfa', 'webauthn'],
          idp: 'auth0',
          security_tier: 'tier_2_mfa_verified'
        },
        token: 'dev_admin_mfa'
      },
      dev_ai_agent: {
        user: {
          id: 'usr-agent-01',
          sub: 'auth0|agent-gemini-netrom-01',
          email: 'ai-agent@timisoara-hub.ro',
          name: 'Autonomous Netrom Gemini Ingestion Agent',
          role: 'admin',
          permissions: ['publish:outages', 'manage:detours', 'ingest:utilities'],
          mfa_enabled: false,
          mfa_verified: true,
          amr: ['m2m', 'client_credentials'],
          idp: 'auth0-m2m',
          security_tier: 'tier_3_ai_agent_m2m'
        },
        token: 'dev_ai_agent'
      }
    };

    // Support role aliases ('admin' -> 'dev_admin_mfa', etc.)
    const key = tokenProfiles[tokenOrRole] ? tokenOrRole : (`dev_${tokenOrRole}_mfa` in tokenProfiles ? `dev_${tokenOrRole}_mfa` : `dev_${tokenOrRole}`);
    const selected = tokenProfiles[key] || tokenProfiles.dev_resident;

    setUser(selected.user);
    setToken(selected.token);
    setIsLoading(false);
  };

  const simulateMfaStepUp = async (factor = 'totp_authenticator'): Promise<boolean> => {
    if (!user) return false;
    const upgradedToken = user.role === 'moderator' ? 'dev_moderator_mfa' : 'dev_admin_mfa';
    await login(upgradedToken);
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, simulateMfaStepUp, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
