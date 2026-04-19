import type { TAdminRole } from './type';
import { adminRequest } from './request';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: TAdminRole;
  created_at: string;
  updated_at: string;
}

export interface ListAdminUsersParams {
  page?: number;
  page_size?: number;
  role?: TAdminRole;
  keyword?: string;
}

export interface ListAdminUsersResponse {
  items: AdminUser[];
  page: number;
  page_size: number;
  total: number;
}

export function listAdminUsers(
  params: ListAdminUsersParams = {},
): Promise<ListAdminUsersResponse> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.page_size ?? 20));
  if (params.role) qs.set('role', params.role);
  if (params.keyword) qs.set('keyword', params.keyword);
  return adminRequest<ListAdminUsersResponse>(
    `/api/admin/users?${qs.toString()}`,
  );
}

export function updateAdminUserRole(
  userId: string,
  role: TAdminRole,
): Promise<AdminUser> {
  return adminRequest<AdminUser, { role: TAdminRole }>(
    `/api/admin/users/${userId}/role`,
    { method: 'PATCH', body: { role } },
  );
}

export interface IUserScopeRestaurant {
  id: number;
  name: string;
}

export interface IUserScope {
  persona: TAdminRole;
  restaurant_ids: number[];
  restaurants: IUserScopeRestaurant[];
  city_codes?: string[];
}

export function getUserScope(userId: string): Promise<IUserScope> {
  return adminRequest<IUserScope>(`/api/admin/users/${userId}/scope`);
}
