import { Navigate, Outlet, useModel } from 'umi';

export default function AuthGuard() {
  const { initialState, loading } = useModel('@@initialState');

  if (loading) return null;

  if (!initialState?.currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
