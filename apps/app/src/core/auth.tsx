import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'resident' | 'organizer' | 'moderator' | 'admin';
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (role?: 'resident' | 'admin') => Promise<void>;
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
  const login = async (targetRole: 'resident' | 'admin' = 'resident') => {
    setIsLoading(true);
    if (targetRole === 'admin') {
      setUser({
        id: 'usr-admin-01',
        email: 'admin@timisoara-hub.ro',
        name: 'Admin Primăria TM',
        role: 'admin'
      });
      setToken('dev_admin');
    } else {
      setUser({
        id: 'usr-resident-01',
        email: 'resident@timisoara-hub.ro',
        name: 'Andrei Timișan',
        role: 'resident'
      });
      setToken('dev_resident');
    }
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
