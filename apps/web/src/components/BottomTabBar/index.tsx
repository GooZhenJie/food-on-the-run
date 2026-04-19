import React from 'react';
import { Link, useLocation } from 'umi';
import {
  HomeFilled,
  SearchOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';

interface ITabItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  matchPaths: string[];
}

const TABS: ITabItem[] = [
  { to: '/', label: 'Home', icon: <HomeFilled />, matchPaths: ['/'] },
  { to: '/dashboard', label: 'Explore', icon: <SearchOutlined />, matchPaths: ['/dashboard'] },
  { to: '/restaurant', label: 'Orders', icon: <ShoppingOutlined />, matchPaths: ['/restaurant'] },
  { to: '/login', label: 'Account', icon: <UserOutlined />, matchPaths: ['/login', '/sign-up'] },
];

export const BottomTabBar: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-safe">
      <div className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.matchPaths.includes(pathname);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? 'text-orange-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
