export type TAdminRole = 'customer' | 'rider' | 'merchant' | 'admin';

export interface IAdminAuthUser {
  id: string;
  name: string;
  email: string;
  role: TAdminRole;
  roles?: string[];
  permissions?: string[];
}

export interface IAdminAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface IAdminAuthResponse extends IAdminAuthTokens {
  user: IAdminAuthUser;
}

export interface IAdminLoginParams {
  email: string;
  password: string;
}
