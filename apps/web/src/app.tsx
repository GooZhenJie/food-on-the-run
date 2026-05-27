import React from 'react';
import { App, ConfigProvider } from 'antd';
import type { RequestConfig } from 'umi';
import { fotrAntdTheme } from '@/theme/antdTheme';
import { CartProvider } from '@/contexts/CartContext';
import type { IAuthUser } from '@/services/type';

const TOKEN_KEY = '__fotr_auth_token__';
const USER_KEY = '__fotr_user__';

export interface IGlobalState {
  currentUser?: IAuthUser;
}

export async function getInitialState(): Promise<IGlobalState> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return {};
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return {};
  try {
    return { currentUser: JSON.parse(raw) as IAuthUser };
  } catch {
    return {};
  }
}

export const request: RequestConfig = {
  baseURL: '/api',
  requestInterceptors: [
    (config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      }
      return config;
    },
  ],
  errorConfig: {
    errorHandler(error) {
      const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
      const serverMsg = axiosError?.response?.data?.error || axiosError?.response?.data?.message;
      if (serverMsg) throw new Error(serverMsg);
      throw error;
    },
  },
};

export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider theme={fotrAntdTheme}>
      <App>
        <CartProvider>{container}</CartProvider>
      </App>
    </ConfigProvider>
  );
}
