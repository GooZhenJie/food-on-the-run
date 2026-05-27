import React from 'react';
import { App, ConfigProvider } from 'antd';
import { adminAntdTheme } from '@/theme/antdTheme';
import { getCurrentUser } from '@/utils/auth';
import type { IAdminAuthUser } from '@/services/type';
import '../tailwind.css';
import '@/global.css';

export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider theme={adminAntdTheme}>
      <App>{container}</App>
    </ConfigProvider>
  );
}

export async function getInitialState(): Promise<{ currentUser: IAdminAuthUser | null }> {
  return { currentUser: getCurrentUser() };
}
