import { Link, Outlet, useLocation } from 'umi';
import { BottomTabBar } from '@/components/BottomTabBar';

const NAV_HIDDEN_PATHS = ['/login', '/sign-up'];

export default function Layout() {
  const { pathname } = useLocation();

  const navItems = [
    { to: '/', label: '🍜 Restaurants' },
    { to: '/restaurant', label: '🏗️ Schema Page' },
    { to: '/dashboard', label: '📊 Dashboard' },
  ];

  if (NAV_HIDDEN_PATHS.includes(pathname)) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <span className="font-bold text-orange-600 text-lg mr-2">Food on the Run</span>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm font-medium transition-colors ${
                pathname === item.to
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex-1" />
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
        </div>
      </nav>
      <Outlet />
      <BottomTabBar />
    </div>
  );
}
