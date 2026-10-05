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

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  mounting: boolean;
  updating: boolean;
  unmounting: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    mounting: true,
    updating: false,
    unmounting: false,
  });

  const isInitialMount = React.useRef(true);

  // Restore session from localStorage on mount and track lifecycle
  useEffect(() => {
    // Track and update mounting vs updating state
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setState((prev) => ({
        ...prev,
        mounting: true,
        updating: false,
        unmounting: false,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        mounting: false,
        updating: true,
        unmounting: false,
      }));
    }

    const storedToken = localStorage.getItem('shelflife_token');
    const storedUser = localStorage.getItem('shelflife_user');

    if (storedToken && storedUser) {
      try {
        setState((prev) => ({
          ...prev,
          token: storedToken,
          user: JSON.parse(storedUser),
          isLoading: false,
          mounting: false,
          updating: false,
        }));
      } catch {
        localStorage.removeItem('shelflife_token');
        localStorage.removeItem('shelflife_user');
        setState((prev) => ({
          ...prev,
          isLoading: false,
          mounting: false,
          updating: false,
        }));
      }
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        mounting: false,
        updating: false,
      }));
    }

    // Track and update unmounting state in cleanup
    return () => {
      setState((prev) => ({
        ...prev,
        mounting: false,
        updating: false,
        unmounting: true,
      }));
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    const { token: newToken, data: userData } = response.data;

    localStorage.setItem('shelflife_token', newToken);
    localStorage.setItem('shelflife_user', JSON.stringify(userData));

    setState((prev) => ({
      ...prev,
      token: newToken,
      user: userData,
    }));
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await authApi.register(data);
    const { token: newToken, data: userData } = response.data;

    localStorage.setItem('shelflife_token', newToken);
    localStorage.setItem('shelflife_user', JSON.stringify(userData));

    setState((prev) => ({
      ...prev,
      token: newToken,
      user: userData,
    }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('shelflife_token');
    localStorage.removeItem('shelflife_user');
    setState((prev) => ({
      ...prev,
      token: null,
      user: null,
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: !!state.token && !!state.user,
        isLoading: state.isLoading,
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
