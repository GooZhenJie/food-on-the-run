import type { ReactNode } from 'react';

export interface IDashboardCardProps {
  title?: string;
  /** Optional small chip next to the title (e.g. "Live · 30s"). */
  badge?: string;
  /** Spans 2 grid columns on lg+. Useful for wide charts in a 4-col section. */
  wide?: boolean;
  children?: ReactNode;
  [key: string]: unknown;
}
