import request from './request';
import type {
  IAuthResponse,
  IForgotPasswordParams,
  ILoginParams,
  IOAuthParams,
  IRegisterParams,
  TOAuthProvider,
} from './type';

export async function login(params: ILoginParams): Promise<IAuthResponse> {
  return request<IAuthResponse>('/auth/login', {
    method: 'POST',
    data: params,
  });
}

export async function register(params: IRegisterParams): Promise<IAuthResponse> {
  return request<IAuthResponse>('/auth/register', {
    method: 'POST',
    data: params,
  });
}

export async function oauthLogin(
  provider: TOAuthProvider,
  params: IOAuthParams,
): Promise<IAuthResponse> {
  return request<IAuthResponse>(`/auth/oauth/${provider}`, {
    method: 'POST',
    data: params,
  });
}

export async function forgotPassword(params: IForgotPasswordParams): Promise<void> {
  return request<void>('/auth/password/forgot', {
    method: 'POST',
    data: params,
  });
}

export async function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' });
}
