import { adminRequest } from './request';
import type { IAdminAuthResponse, IAdminLoginParams } from './type';

export function adminLogin(
  params: IAdminLoginParams,
): Promise<IAdminAuthResponse> {
  return adminRequest<IAdminAuthResponse, IAdminLoginParams>(
    '/api/auth/login',
    { method: 'POST', body: params },
  );
}
