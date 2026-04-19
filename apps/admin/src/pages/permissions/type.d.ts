import type { TAdminRole } from '@/services/type';
import type { AdminUser } from '@/services/users';

export type PermissionsRoleFilter = TAdminRole | 'all';

export interface PermissionsListState {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
}

export interface PermissionsQuery {
  page: number;
  pageSize: number;
  role: PermissionsRoleFilter;
  keyword: string;
}
