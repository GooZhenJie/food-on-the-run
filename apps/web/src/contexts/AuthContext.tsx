import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { history } from 'umi';
import { App } from 'antd';
import {
  getAccessToken,
  getCurrentUser,
  setAuth as persistAuth,
  clearAuth as removeAuth,
} from '@/utils/auth';
import { logout as logoutApi } from '@/services/auth';
import type { IAuthResponse, IAuthUser } from '@/services/type';

interface IAuthContext {
  user: IAuthUser | null;
  isLoggedIn: boolean;
  login: (payload: IAuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<IAuthContext | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IAuthUser | null>(() => {
    if (getAccessToken()) return getCurrentUser();
    return null;
  });
  const { message } = App.useApp();

  // Sync with localStorage changes from AuthForm (which calls setAuth directly)
  useEffect(() => {
    const sync = () => {
      const current = getCurrentUser();
      setUser(current);
    };

    // Listen for storage events (cross-tab) and custom event (same-tab)
    window.addEventListener('storage', sync);
    window.addEventListener('fotr-auth-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('fotr-auth-change', sync);
    };
  }, []);

  const login = useCallback((payload: IAuthResponse) => {
    persistAuth(payload);
    setUser(payload.user);
    window.dispatchEvent(new Event('fotr-auth-change'));
    history.push('/');
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore API error on logout
    }
    removeAuth();
    setUser(null);
    window.dispatchEvent(new Event('fotr-auth-change'));
    message.success('Signed out');
    history.push('/');
  }, [message]);

  const isLoggedIn = Boolean(user);

  const value = useMemo<IAuthContext>(
    () => ({ user, isLoggedIn, login, logout }),
    [user, isLoggedIn, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): IAuthContext => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
