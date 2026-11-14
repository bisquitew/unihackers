import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '@hub/api-client';
import { api, setSessionToken } from './api';
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
  neighbourhood?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isResident: boolean;
  login: (tokenOrRole?: string) => Promise<void>;
  loginAsResident: () => Promise<void>;
  /** Signs in through the API (the demo sign-in). Resolves with an error message when it is refused. */
  signIn: (method: 'google' | 'email', email?: string) => Promise<{ ok: boolean; error?: string }>;
  loginAsAdmin: () => Promise<void>;
  simulateMfaStepUp: (factor?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  /** Set when a sign-in is refused, e.g. a staff account in the app. Cleared by the next attempt or `clearAuthError`. */
  authError: string | null;
  clearAuthError: () => void;
}

/** Staff (admin, moderator) sign in only on the web dashboard; the app is for residents. The API enforces the same rule. */
export const STAFF_ROLES = ['admin', 'moderator'];
export const STAFF_MESSAGE = 'City staff accounts sign in on the web dashboard, not in the app.';

const STORAGE_KEY = '@hub_auth_token';

export const USER_RESIDENT: AuthUser = {
  id: '5121dd56-e1cc-42af-bd8e-5fe8c5126502',
  sub: 'auth0|dev-resident-01',
  email: 'resident@timisoara-hub.ro',
  name: 'Andrei Timișan',
  role: 'resident',
  neighbourhood: 'Cetate',
  permissions: ['read:city-alerts', 'read:parking', 'read:transit', 'create:reports', 'rsvp:events'],
  mfa_enabled: false,
  mfa_verified: false,
  amr: ['email-passwordless'],
  idp: 'email-passwordless',
  security_tier: 'tier_1_standard'
};

export const USER_ADMIN: AuthUser = {
  id: '4002bf66-c6b0-4f8c-9e5e-300018deb27e',
  sub: 'auth0|dev-admin-01',
  email: 'admin@timisoara-hub.ro',
  name: 'Admin Primăria TM',
  role: 'admin',
  neighbourhood: 'Centru - Primărie',
  permissions: [
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
  ],
  mfa_enabled: true,
  mfa_verified: true,
  amr: ['pwd', 'mfa', 'webauthn'],
  idp: 'auth0',
  security_tier: 'tier_2_mfa_verified'
};

export const TOKEN_PROFILES: Record<string, { user: AuthUser; token: string }> = {
  dev_resident: {
    user: USER_RESIDENT,
    token: 'dev_resident'
  },
  dev_admin_mfa: {
    user: USER_ADMIN,
    token: 'dev_admin_mfa'
  },
  dev_admin: {
    user: USER_ADMIN,
    token: 'dev_admin_mfa'
  },
  dev_organizer: {
    user: {
      id: 'usr-organizer-01',
      sub: 'auth0|dev-org-01',
      email: 'organizer@timisoara-hub.ro',
      name: 'Ioana Popa',
      role: 'organizer',
      neighbourhood: 'Fabric',
      permissions: ['read:city-alerts', 'create:events', 'manage:tickets', 'rsvp:events'],
      mfa_enabled: false,
      mfa_verified: false,
      amr: ['google-oauth2'],
      idp: 'google-oauth2',
      security_tier: 'tier_1_standard'
    },
    token: 'dev_organizer'
  },
  dev_moderator_mfa: {
    user: {
      id: 'usr-mod-01',
      sub: 'auth0|dev-mod-01',
      email: 'moderator@timisoara-hub.ro',
      name: 'Mihai Moderator [MFA Active]',
      role: 'moderator',
      neighbourhood: 'Circumvalațiunii',
      permissions: ['read:city-alerts', 'moderate:forum', 'resolve:reports', 'view:audit-log'],
      mfa_enabled: true,
      mfa_verified: true,
      amr: ['pwd', 'mfa', 'totp'],
      idp: 'auth0',
      security_tier: 'tier_2_mfa_verified'
    },
    token: 'dev_moderator_mfa'
  }
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoggedIn: false,
  isAdmin: false,
  isResident: false,
  login: async () => {},
  loginAsResident: async () => {},
  signIn: async () => ({ ok: false }),
  loginAsAdmin: async () => {},
  simulateMfaStepUp: async () => false,
  logout: () => {},
  isLoading: true,
  authError: null,
  clearAuthError: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore saved authentication token on app mount
  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const savedToken = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && savedToken) {
          setSessionToken(savedToken);
          try {
            // ask the API who this token is; a token it no longer knows comes back as a guest
            const me = await api.get<any>('/v1/core/auth/me');
            if (me?.sub && me.sub !== 'guest|unauthenticated' && !STAFF_ROLES.includes(me.role)) {
              setUser({ ...me, id: me.id ?? me.sub });
              setToken(savedToken);
            } else {
              setSessionToken(null);
            }
          } catch (err) {
            // the API is not reachable: keep a saved demo session so the app still opens
            const profile = TOKEN_PROFILES[savedToken];
            if (err instanceof ApiError && err.offline && profile && !STAFF_ROLES.includes(profile.user.role)) {
              setUser(profile.user);
              setToken(profile.token);
            } else {
              setSessionToken(null);
            }
          }
        }
      } catch (err) {
        console.warn('Could not restore auth token from storage:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (tokenOrRole: string = 'dev_resident') => {
    setIsLoading(true);

    const key = TOKEN_PROFILES[tokenOrRole]
      ? tokenOrRole
      : (`dev_${tokenOrRole}_mfa` in TOKEN_PROFILES ? `dev_${tokenOrRole}_mfa` : `dev_${tokenOrRole}`);
    
    const selected = TOKEN_PROFILES[key] || TOKEN_PROFILES.dev_resident;

    if (STAFF_ROLES.includes(selected.user.role)) {
      setAuthError(STAFF_MESSAGE);
      setIsLoading(false);
      return;
    }
    setAuthError(null);
    setSessionToken(selected.token);
    setUser(selected.user);
    setToken(selected.token);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, selected.token);
    } catch {}
    setIsLoading(false);
  };

  const signIn = async (method: 'google' | 'email', email?: string): Promise<{ ok: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const path = method === 'google' ? '/v1/core/auth/google-login' : '/v1/core/auth/login';
      const result = await api.post<{ token: string; user: any }>(path, method === 'google' ? { email: email || 'alex.popescu@gmail.com', name: 'Alex Popescu' } : { email });
      if (STAFF_ROLES.includes(result.user?.role)) {
        setAuthError(STAFF_MESSAGE);
        return { ok: false, error: STAFF_MESSAGE };
      }
      setSessionToken(result.token);
      setUser({ ...result.user, id: result.user.id ?? result.user.sub });
      setToken(result.token);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, result.token);
      } catch {}
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError && err.offline) {
        // the demo still opens without the server: a local resident profile, whose token the API accepts once it is back
        await login('dev_resident');
        return { ok: true };
      }
      const message = err instanceof ApiError && err.code === 'use_web_dashboard' ? STAFF_MESSAGE : err instanceof Error ? err.message : 'Could not sign in.';
      setAuthError(message);
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsResident = async () => {
    await login('dev_resident');
  };

  const loginAsAdmin = async () => {
    await login('dev_admin_mfa');
  };

  const simulateMfaStepUp = async (factor = 'totp_authenticator'): Promise<boolean> => {
    if (!user) return false;
    const upgradedToken = user.role === 'moderator' ? 'dev_moderator_mfa' : 'dev_admin_mfa';
    await login(upgradedToken);
    return true;
  };

  const logout = () => {
    setSessionToken(null);
    setUser(null);
    setToken(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  };

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === 'admin';
  const isResident = user?.role === 'resident';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,
        isAdmin,
        isResident,
        login,
        loginAsResident,
        signIn,
        loginAsAdmin,
        simulateMfaStepUp,
        logout,
        isLoading,
        authError,
        clearAuthError: () => setAuthError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
