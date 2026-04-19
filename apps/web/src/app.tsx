import React from 'react';
import { App, ConfigProvider } from 'antd';
import { fotrAntdTheme } from '@/theme/antdTheme';

export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider theme={fotrAntdTheme}>
      <App>{container}</App>
    </ConfigProvider>
  );
}
