import { Link, Outlet, useLocation } from 'umi';
import {
  ShopOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  PieChartOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Dropdown } from 'antd';
import { BottomTabBar } from '@/components/BottomTabBar';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const NAV_HIDDEN_PATHS = ['/login', '/sign-up', '/checkout'];

export default function Layout() {
  const { pathname } = useLocation();
  const { itemCount } = useCart();
  const { user, isLoggedIn, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Restaurants', icon: <ShopOutlined /> },
    { to: '/orders', label: 'Orders', icon: <FileTextOutlined /> },
    { to: '/dashboard', label: 'Dashboard', icon: <PieChartOutlined /> },
  ];

  if (NAV_HIDDEN_PATHS.includes(pathname)) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link to="/" className="font-bold text-orange-600 text-lg mr-2">Food on the Run</Link>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                pathname === item.to
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="flex-1" />

          {/* Cart icon */}
          <Link
            to="/cart"
            className="relative text-gray-600 hover:text-orange-600 transition-colors p-2"
          >
            <ShoppingCartOutlined className="text-xl" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Auth area */}
          {isLoggedIn ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'user-info',
                    label: (
                      <div className="px-1 py-1">
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                    ),
                    disabled: true,
                  },
                  { type: 'divider' },
                  {
                    key: 'orders',
                    label: <Link to="/orders">My orders</Link>,
                    icon: <FileTextOutlined />,
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    label: 'Sign out',
                    icon: <LogoutOutlined />,
                    danger: true,
                    onClick: logout,
                  },
                ],
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase() || <UserOutlined />}
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                  {user?.name?.split(' ')[0]}
                </span>
              </button>
            </Dropdown>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/sign-up"
                className="text-sm font-semibold bg-orange-500 text-white rounded-full px-4 py-1.5 hover:bg-orange-600 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
      <Outlet />
      <BottomTabBar />
    </div>
  );
}
