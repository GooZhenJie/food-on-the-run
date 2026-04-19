import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { history, useLocation } from 'umi';
import { clearAuth } from '@/utils/auth';
import type { AdminLayoutProps, NavItem } from './type';

const { Sider, Header, Content } = Layout;

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: 'restaurants', path: '/restaurants', label: 'Restaurants', icon: <ShopOutlined /> },
  { key: 'orders', path: '/orders', label: 'Orders', icon: <ShoppingCartOutlined /> },
  { key: 'users', path: '/users', label: 'Users', icon: <TeamOutlined /> },
  { key: 'permissions', path: '/permissions', label: 'Permissions', icon: <SafetyCertificateOutlined /> },
  { key: 'schemas', path: '/schemas', label: 'Page Schemas', icon: <AppstoreOutlined /> },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();

  const activeKey =
    NAV_ITEMS.find((item) =>
      item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
    )?.key ?? 'dashboard';

  return (
    <Layout className="min-h-screen">
      <Sider width={220} className="!bg-slate-900">
        <div className="h-14 flex items-center px-5 text-white font-semibold tracking-tight">
          <span className="text-orange-500 mr-2">●</span>
          FOTR Admin
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[activeKey]}
          items={NAV_ITEMS.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          onClick={({ key }) => {
            const target = NAV_ITEMS.find((item) => item.key === key);
            if (target) history.push(target.path);
          }}
        />
      </Sider>
      <Layout>
        <Header className="!bg-white !px-6 flex items-center justify-between border-b border-gray-200">
          <span className="text-sm text-gray-500">
            Internal console · v0.1
          </span>
          <a
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            onClick={() => {
              clearAuth();
              history.push('/login');
            }}
          >
            Sign out
          </a>
        </Header>
        <Content className="p-6">{children}</Content>
      </Layout>
    </Layout>
  );
};
