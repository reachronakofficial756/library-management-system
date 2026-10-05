import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, LoginCredentials, RegisterData } from '../types';
import { authApi } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('shelflife_token');
    const storedUser = localStorage.getItem('shelflife_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('shelflife_token');
        localStorage.removeItem('shelflife_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    const { token: newToken, data: userData } = response.data;

    localStorage.setItem('shelflife_token', newToken);
    localStorage.setItem('shelflife_user', JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await authApi.register(data);
    const { token: newToken, data: userData } = response.data;

    localStorage.setItem('shelflife_token', newToken);
    localStorage.setItem('shelflife_user', JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('shelflife_token');
    localStorage.removeItem('shelflife_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
