import React, { useEffect, useState } from 'react';
import { Button, Drawer, Grid, Layout, Menu } from 'antd';
import {
  AppstoreOutlined,
  DashboardOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { history, useAccess, useLocation } from 'umi';
import { clearAuth } from '@/utils/auth';
import type { AdminLayoutProps, NavItem } from './type';

const { Sider, Header, Content } = Layout;
const { useBreakpoint } = Grid;

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: 'restaurants', path: '/restaurants', label: 'Restaurants', icon: <ShopOutlined /> },
  { key: 'orders', path: '/orders', label: 'Orders', icon: <ShoppingCartOutlined /> },
  { key: 'users', path: '/users', label: 'Users', icon: <TeamOutlined />, accessKey: 'canManageUsers' },
  { key: 'permissions', path: '/permissions', label: 'Permissions', icon: <SafetyCertificateOutlined />, accessKey: 'canManagePermissions' },
  { key: 'schemas', path: '/schemas', label: 'Page Schemas', icon: <AppstoreOutlined />, accessKey: 'canManageSchemas' },
];

const BrandBar: React.FC = () => (
  <div className="h-14 flex items-center px-5 text-white font-semibold tracking-tight">
    <span className="text-orange-500 mr-2">●</span>
    FOTR Admin
  </div>
);

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const screens = useBreakpoint();
  const isMobile = screens.md === false;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const access = useAccess();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.accessKey || access[item.accessKey as keyof typeof access],
  );

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const activeKey =
    visibleItems.find((item) =>
      item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
    )?.key ?? 'dashboard';

  const navMenu = (
    <Menu
      mode="inline"
      theme="dark"
      selectedKeys={[activeKey]}
      items={visibleItems.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
      }))}
      onClick={({ key }) => {
        const target = visibleItems.find((item) => item.key === key);
        if (target) {
          history.push(target.path);
          setDrawerOpen(false);
        }
      }}
    />
  );

  return (
    <Layout className="min-h-screen">
      {isMobile ? (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={240}
          closable={false}
          classNames={{
            body: '!p-0 !bg-slate-900',
            header: 'hidden',
          }}
        >
          <BrandBar />
          {navMenu}
        </Drawer>
      ) : (
        <Sider width={220} className="!bg-slate-900">
          <BrandBar />
          {navMenu}
        </Sider>
      )}

      <Layout>
        <Header className="!bg-white !px-4 md:!px-6 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation"
              />
            ) : null}
            <span className="text-sm text-gray-500 truncate">
              Internal console · v0.1
            </span>
          </div>
          <a
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors whitespace-nowrap"
            onClick={() => {
              clearAuth();
              history.push('/login');
            }}
          >
            Sign out
          </a>
        </Header>
        <Content className="p-4 md:p-6">{children}</Content>
      </Layout>
    </Layout>
  );
};
