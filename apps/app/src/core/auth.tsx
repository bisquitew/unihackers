import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '@hub/contracts';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (role?: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isLoading: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>({
    id: 'usr-resident-01',
    email: 'resident@timisoara-hub.ro',
    name: 'Andrei Timișan',
    role: 'resident'
  });
  const [token, setToken] = useState<string | null>('dev_resident');
  const [isLoading, setIsLoading] = useState(false);

  // Dev login toggle for testing all roles without waiting for Auth0 credentials
  const login = async (targetRole: UserRole = 'resident') => {
    setIsLoading(true);
    const roleProfiles: Record<UserRole, { name: string; email: string; token: string }> = {
      resident: { name: 'Andrei Timișan', email: 'resident@timisoara-hub.ro', token: 'dev_resident' },
      admin: { name: 'Admin Primăria TM', email: 'admin@timisoara-hub.ro', token: 'dev_admin' },
      moderator: { name: 'Moderator Comunitar', email: 'moderator@timisoara-hub.ro', token: 'dev_moderator' },
      organizer: { name: 'Organizator Evenimente', email: 'organizer@timisoara-hub.ro', token: 'dev_organizer' }
    };

    const profile = roleProfiles[targetRole] || roleProfiles.resident;
    setUser({
      id: `usr-${targetRole}-01`,
      email: profile.email,
      name: profile.name,
      role: targetRole
    });
    setToken(profile.token);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
