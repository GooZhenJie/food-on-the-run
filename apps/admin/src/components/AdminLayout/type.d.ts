import type { ReactNode } from 'react';

export interface AdminLayoutProps {
  children: ReactNode;
}

export interface NavItem {
  key: string;
  path: string;
  label: string;
  icon?: ReactNode;
}
