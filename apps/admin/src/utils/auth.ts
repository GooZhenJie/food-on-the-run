import type { IAdminAuthResponse, IAdminAuthUser } from '@/services/type';

const TOKEN_KEY = '__fotr_admin_token__';
const REFRESH_KEY = '__fotr_admin_refresh__';
const USER_KEY = '__fotr_admin_user__';

export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
};

export const getCurrentUser = (): IAdminAuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IAdminAuthUser;
  } catch {
    return null;
  }
};

export const setAuth = (payload: IAdminAuthResponse): void => {
  localStorage.setItem(TOKEN_KEY, payload.access_token);
  localStorage.setItem(REFRESH_KEY, payload.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
};

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = (): boolean => Boolean(getAccessToken());
