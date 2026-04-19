import type { TAdminRole } from './type';
import { adminRequest } from './request';

export interface IRoleScope {
  restaurant_ids?: number[];
  city_codes?: string[];
}

export interface IRole {
  id: number;
  code: string;
  name: string;
  persona: TAdminRole;
  is_system: boolean;
  permission_codes?: string[];
}

export interface IRoleAssignment {
  role_id: number;
  code: string;
  name: string;
  persona: TAdminRole;
  is_system: boolean;
  scope?: IRoleScope | null;
  expires_at?: string | null;
}

export interface IPermission {
  id: number;
  code: string;
  description?: string;
}

export type TGrantEffect = 'allow' | 'deny';

export interface IUserGrant {
  user_id: number;
  permission_id: number;
  permission_code: string;
  effect: TGrantEffect;
  scope?: IRoleScope | null;
  reason?: string;
  granted_by?: number | null;
  granted_at: string;
  expires_at?: string | null;
}

export interface IListEnvelope<T> {
  items: T[];
}

export function listRoles(): Promise<IListEnvelope<IRole>> {
  return adminRequest<IListEnvelope<IRole>>('/api/admin/roles');
}

export function listPermissions(): Promise<IListEnvelope<IPermission>> {
  return adminRequest<IListEnvelope<IPermission>>('/api/admin/permissions');
}

export function listUserRoles(
  userId: string,
): Promise<IListEnvelope<IRoleAssignment>> {
  return adminRequest<IListEnvelope<IRoleAssignment>>(
    `/api/admin/users/${userId}/roles`,
  );
}

export function updateUserRoles(
  userId: string,
  roleCodes: string[],
): Promise<IListEnvelope<IRoleAssignment>> {
  return adminRequest<IListEnvelope<IRoleAssignment>, { role_codes: string[] }>(
    `/api/admin/users/${userId}/roles`,
    { method: 'PUT', body: { role_codes: roleCodes } },
  );
}

export interface ICreateRolePayload {
  code: string;
  name: string;
  persona: TAdminRole;
}

export function createRole(payload: ICreateRolePayload): Promise<IRole> {
  return adminRequest<IRole, ICreateRolePayload>('/api/admin/roles', {
    method: 'POST',
    body: payload,
  });
}

export function updateRoleName(
  roleId: number,
  name: string,
): Promise<IRole> {
  return adminRequest<IRole, { name: string }>(
    `/api/admin/roles/${roleId}`,
    { method: 'PATCH', body: { name } },
  );
}

export function deleteRole(roleId: number): Promise<void> {
  return adminRequest<void>(`/api/admin/roles/${roleId}`, {
    method: 'DELETE',
  });
}

export function putRolePermissions(
  roleId: number,
  permissionCodes: string[],
): Promise<IRole> {
  return adminRequest<IRole, { permission_codes: string[] }>(
    `/api/admin/roles/${roleId}/permissions`,
    { method: 'PUT', body: { permission_codes: permissionCodes } },
  );
}

export interface IPutUserRoleScopePayload {
  scope: IRoleScope | null;
  expires_at: string | null;
}

export function putUserRoleScope(
  userId: string,
  roleId: number,
  payload: IPutUserRoleScopePayload,
): Promise<IRoleAssignment> {
  return adminRequest<IRoleAssignment, IPutUserRoleScopePayload>(
    `/api/admin/users/${userId}/roles/${roleId}/scope`,
    { method: 'PUT', body: payload },
  );
}

export function listUserGrants(
  userId: string,
): Promise<IListEnvelope<IUserGrant>> {
  return adminRequest<IListEnvelope<IUserGrant>>(
    `/api/admin/users/${userId}/grants`,
  );
}

export interface IPutUserGrantPayload {
  effect: TGrantEffect;
  scope: IRoleScope | null;
  reason: string;
  expires_at: string | null;
}

export function putUserGrant(
  userId: string,
  permissionId: number,
  payload: IPutUserGrantPayload,
): Promise<IUserGrant> {
  return adminRequest<IUserGrant, IPutUserGrantPayload>(
    `/api/admin/users/${userId}/grants/${permissionId}`,
    { method: 'PUT', body: payload },
  );
}

export function deleteUserGrant(
  userId: string,
  permissionId: number,
): Promise<void> {
  return adminRequest<void>(
    `/api/admin/users/${userId}/grants/${permissionId}`,
    { method: 'DELETE' },
  );
}
