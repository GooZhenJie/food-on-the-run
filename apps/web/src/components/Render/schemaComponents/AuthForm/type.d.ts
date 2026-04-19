import type { IAuthFormConfig } from '../../type';

export interface IAuthFormProps extends Partial<IAuthFormConfig> {
  [key: string]: unknown;
}

export interface IAuthFormApiResponse {
  user?: { name?: string };
  [key: string]: unknown;
}
