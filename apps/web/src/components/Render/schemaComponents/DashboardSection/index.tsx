import React from 'react';
import { cn } from '@food/shared';
import type {
  IDashboardSectionProps,
  TDashboardSectionCols,
  TDashboardSectionGap,
  TDashboardSectionMb,
} from './type';

/**
 * Static class maps — Tailwind's JIT requires literal class strings,
 * so dynamic values (cols / gap / mb) are resolved through these lookups.
 */
const COLS_CLASS: Record<TDashboardSectionCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 lg:grid-cols-2',
  3: 'grid-cols-1 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

const GAP_CLASS: Record<TDashboardSectionGap, string> = {
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
};

const MB_CLASS: Record<TDashboardSectionMb, string> = {
  0: '',
  2: 'mb-2',
  4: 'mb-4',
  6: 'mb-6',
  8: 'mb-8',
};

export const DashboardSection: React.FC<IDashboardSectionProps> = ({
  cols = 2,
  gap = 6,
  mb = 6,
  title,
  children,
}) => {
  return (
    <section className={cn(MB_CLASS[mb])}>
      {title ? (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          {title}
        </h2>
      ) : null}
      <div className={cn('grid', COLS_CLASS[cols], GAP_CLASS[gap])}>
        {children}
      </div>
    </section>
  );
};
