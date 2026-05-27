import { useCallback } from 'react';
import { history, useModel } from 'umi';
import { App } from 'antd';
import { setAuth, clearAuth } from '@/utils/auth';
import { logout as logoutApi } from '@/services/auth';
import type { IAuthResponse, IAuthUser } from '@/services/type';
import type { IGlobalState } from '@/app';

interface IAuthContext {
  user: IAuthUser | null;
  isLoggedIn: boolean;
  login: (payload: IAuthResponse) => void;
  logout: () => void;
}

export function useAuth(): IAuthContext {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { message } = App.useApp();

  const login = useCallback(
    (payload: IAuthResponse) => {
      setAuth(payload);
      setInitialState((prev: IGlobalState | undefined) => ({ ...prev, currentUser: payload.user }));
      history.push('/');
    },
    [setInitialState],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore API error on logout
    }
    clearAuth();
    setInitialState((prev: IGlobalState | undefined) => ({ ...prev, currentUser: undefined }));
    message.success('Signed out');
    history.push('/');
  }, [setInitialState, message]);

  return {
    user: initialState?.currentUser ?? null,
    isLoggedIn: Boolean(initialState?.currentUser),
    login,
    logout,
  };
}
