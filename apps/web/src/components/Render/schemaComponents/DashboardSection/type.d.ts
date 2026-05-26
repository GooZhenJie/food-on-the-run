import type { ReactNode } from 'react';

export type TDashboardSectionCols = 1 | 2 | 3 | 4;
export type TDashboardSectionGap = 2 | 3 | 4 | 5 | 6 | 8;
export type TDashboardSectionMb = 0 | 2 | 4 | 6 | 8;

export interface IDashboardSectionProps {
  /** Column count on desktop (lg+). Mobile always stacks to 1. */
  cols?: TDashboardSectionCols;
  /** Tailwind gap scale. */
  gap?: TDashboardSectionGap;
  /** Bottom margin in Tailwind scale. */
  mb?: TDashboardSectionMb;
  /** Optional section title rendered above the grid. */
  title?: string;
  children?: ReactNode;
  [key: string]: unknown;
}
