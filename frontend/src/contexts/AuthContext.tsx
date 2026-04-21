import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getMe } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const { login: loginApi } = await import('../services/authService');
    const userData = await loginApi(email, password);
    setUser(userData);
  };

  const logout = async () => {
    try {
      const { logout: logoutApi } = await import('../services/authService');
      await logoutApi();
    } catch (error) {
      // If the server throws a 401, the session is already dead. 
      // We catch the error here so the app doesn't crash.
      console.warn('Server logout failed, clearing local state anyway.');
    } finally {
      // This will ALWAYS run, completely clearing the user from React memory 
      // and forcing a redirect to the login screen.
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
