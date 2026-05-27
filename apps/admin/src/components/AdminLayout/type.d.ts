import type { ReactNode } from 'react';

export interface AdminLayoutProps {
  children: ReactNode;
}

export interface NavItem {
  key: string;
  path: string;
  label: string;
  icon?: ReactNode;
  /** access key from src/access.ts that must be truthy for this item to show */
  accessKey?: string;
}
