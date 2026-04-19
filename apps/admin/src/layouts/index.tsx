import { Outlet, useLocation } from 'umi';
import { AdminLayout } from '@/components/AdminLayout';

const FULL_BLEED_PATHS = ['/login'];

export default function Layout() {
  const { pathname } = useLocation();

  if (FULL_BLEED_PATHS.includes(pathname)) {
    return <Outlet />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
