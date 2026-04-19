import React from 'react';
import { App, ConfigProvider } from 'antd';
import { adminAntdTheme } from '@/theme/antdTheme';
import '../tailwind.css';
import '@/global.css';

export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider theme={adminAntdTheme}>
      <App>{container}</App>
    </ConfigProvider>
  );
}
