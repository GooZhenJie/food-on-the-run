import type { TAdminRole } from './type';
import { adminRequest } from './request';

export type AdminUserStatus = 'active' | 'banned';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: TAdminRole;
  status?: AdminUserStatus;
  orders_count?: number;
  lifetime_spend_cents?: number;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ListAdminUsersParams {
  page?: number;
  page_size?: number;
  role?: TAdminRole;
  status?: AdminUserStatus;
  keyword?: string;
  sort_field?:
    | 'name'
    | 'orders_count'
    | 'lifetime_spend_cents'
    | 'last_active_at'
    | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface ListAdminUsersResponse {
  items: AdminUser[];
  page: number;
  page_size: number;
  total: number;
}

export interface ExportAdminUsersResponse {
  items: AdminUser[];
  total: number;
}

export interface AdminUserUpsertBody {
  name: string;
  email: string;
  phone?: string;
  role?: TAdminRole;
  status?: AdminUserStatus;
}

const buildQuery = (params: ListAdminUsersParams): string => {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.page_size ?? 20));
  if (params.role) qs.set('role', params.role);
  if (params.status) qs.set('status', params.status);
  if (params.keyword) qs.set('keyword', params.keyword);
  if (params.sort_field) qs.set('sort_field', params.sort_field);
  if (params.sort_order) qs.set('sort_order', params.sort_order);
  return qs.toString();
};

export function listAdminUsers(
  params: ListAdminUsersParams = {},
): Promise<ListAdminUsersResponse> {
  return adminRequest<ListAdminUsersResponse>(
    `/api/admin/users?${buildQuery(params)}`,
  );
}

export function exportAdminUsers(
  params: ListAdminUsersParams = {},
): Promise<ExportAdminUsersResponse> {
  return adminRequest<ExportAdminUsersResponse>(
    `/api/admin/users/export?${buildQuery(params)}`,
  );
}

export function getAdminUser(id: string): Promise<AdminUser> {
  return adminRequest<AdminUser>(`/api/admin/users/${id}`);
}

export function createAdminUser(
  body: AdminUserUpsertBody,
): Promise<AdminUser> {
  return adminRequest<AdminUser, AdminUserUpsertBody>('/api/admin/users', {
    method: 'POST',
    body,
  });
}

export function updateAdminUser(
  id: string,
  body: Partial<AdminUserUpsertBody>,
): Promise<AdminUser> {
  return adminRequest<AdminUser, Partial<AdminUserUpsertBody>>(
    `/api/admin/users/${id}`,
    { method: 'PATCH', body },
  );
}

export function deleteAdminUser(id: string): Promise<void> {
  return adminRequest<void>(`/api/admin/users/${id}`, { method: 'DELETE' });
}

export function banAdminUser(id: string): Promise<AdminUser> {
  return adminRequest<AdminUser>(`/api/admin/users/${id}/ban`, {
    method: 'POST',
  });
}

export function unbanAdminUser(id: string): Promise<AdminUser> {
  return adminRequest<AdminUser>(`/api/admin/users/${id}/unban`, {
    method: 'POST',
  });
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
