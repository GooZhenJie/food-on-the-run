import React from 'react';
import { Link, useLocation } from 'umi';
import {
  HomeFilled,
  HomeOutlined,
  ShoppingCartOutlined,
  ShoppingFilled,
  FileTextOutlined,
  FileTextFilled,
  UserOutlined,
} from '@ant-design/icons';
import { useCart } from '@/contexts/CartContext';

interface ITabItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  matchPaths: string[];
}

const TABS: ITabItem[] = [
  { to: '/', label: 'Home', icon: <HomeOutlined />, activeIcon: <HomeFilled />, matchPaths: ['/'] },
  { to: '/orders', label: 'Orders', icon: <FileTextOutlined />, activeIcon: <FileTextFilled />, matchPaths: ['/orders'] },
  { to: '/cart', label: 'Cart', icon: <ShoppingCartOutlined />, activeIcon: <ShoppingFilled />, matchPaths: ['/cart'] },
  { to: '/login', label: 'Account', icon: <UserOutlined />, activeIcon: <UserOutlined />, matchPaths: ['/login', '/sign-up'] },
];

export const BottomTabBar: React.FC = () => {
  const { pathname } = useLocation();
  const { itemCount } = useCart();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-safe">
      <div className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.matchPaths.includes(pathname);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? 'text-orange-600' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{active ? tab.activeIcon : tab.icon}</span>
              <span>{tab.label}</span>
              {/* Cart badge */}
              {tab.to === '/cart' && itemCount > 0 && (
                <span className="absolute top-1.5 right-1/2 translate-x-4 w-[16px] h-[16px] bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
