import type { IAdminAuthUser } from '@/services/type';

export default function access(initialState: { currentUser?: IAdminAuthUser | null }) {
  const role = initialState?.currentUser?.role;
  return {
    isAdmin: role === 'admin',
    isMerchant: role === 'merchant',
    canManageUsers: role === 'admin',
    canManagePermissions: role === 'admin',
    canManageSchemas: role === 'admin',
  };
}
