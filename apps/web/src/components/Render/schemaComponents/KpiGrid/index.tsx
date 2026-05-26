import React from 'react';
import { cn } from '@food/shared';
import { useServiceData } from '@/components/Service/context';
import type { IKpiGridProps, IKpiItem, TKpiGridData } from './type';

const COLS_CLASS: Record<NonNullable<IKpiGridProps['cols']>, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

const formatValue = (item: IKpiItem): string => {
  const { value, unit } = item;
  if (unit === 'RM') {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isNaN(num)) return `RM ${num.toLocaleString()}`;
  }
  return `${value}${unit ? ` ${unit}` : ''}`;
};

const trendColor = (item: IKpiItem): string => {
  const { direction, invertColor } = item;
  if (!direction || direction === 'flat') return 'text-gray-500';
  const isGood = invertColor ? direction === 'down' : direction === 'up';
  return isGood ? 'text-green-600' : 'text-red-500';
};

export const KpiGrid: React.FC<IKpiGridProps> = ({ cols = 4 }) => {
  const { data, loading } = useServiceData();
  const items = (data as TKpiGridData) || [];

  if (loading && items.length === 0) {
    return (
      <div className={cn('grid gap-4', COLS_CLASS[cols])}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', COLS_CLASS[cols])}>
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <p className="text-xs text-gray-400 font-medium">{item.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatValue(item)}
          </p>
          {item.trend ? (
            <p className={cn('text-xs mt-1 font-semibold', trendColor(item))}>
              {item.trend}
              {item.note ? (
                <span className="text-gray-400 font-normal"> · {item.note}</span>
              ) : null}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
};
