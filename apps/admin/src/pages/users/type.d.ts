import type {
  AdminUser,
  AdminUserStatus,
  ListAdminUsersParams,
} from '@/services/users';
import type { TAdminRole } from '@/services/type';

export type UsersRoleFilter = TAdminRole | 'all';
export type UsersStatusFilter = AdminUserStatus | 'all';

export interface UsersListState {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
}

export type UsersQuery = Required<
  Pick<ListAdminUsersParams, 'page' | 'page_size' | 'sort_field' | 'sort_order'>
> & {
  keyword: string;
  role: UsersRoleFilter;
  status: UsersStatusFilter;
};
