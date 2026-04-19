import type React from 'react';
import type { IAuthPageConfig } from '../../type';

export interface IAuthPageProps extends Partial<IAuthPageConfig> {
  children?: React.ReactNode;
  [key: string]: unknown;
}
