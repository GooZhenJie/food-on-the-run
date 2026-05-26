import React from 'react';
import { App, ConfigProvider } from 'antd';
import { fotrAntdTheme } from '@/theme/antdTheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';

export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider theme={fotrAntdTheme}>
      <App>
        <AuthProvider>
          <CartProvider>{container}</CartProvider>
        </AuthProvider>
      </App>
    </ConfigProvider>
  );
}
