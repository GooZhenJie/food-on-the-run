import React from 'react';
import { cn } from '@food/shared';
import type { IDashboardCardProps } from './type';

export const DashboardCard: React.FC<IDashboardCardProps> = ({
  title,
  badge,
  wide,
  children,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 shadow-sm border border-gray-100',
        wide ? 'lg:col-span-2' : '',
      )}
    >
      {(title || badge) && (
        <div className="flex items-center gap-2 mb-4">
          {title ? (
            <h3 className="font-bold text-gray-800">{title}</h3>
          ) : null}
          {badge ? (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {badge}
            </span>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
};
