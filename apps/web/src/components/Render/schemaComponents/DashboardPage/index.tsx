import React from 'react';
import { Link } from 'umi';
import { Refresh } from '@/components/Refresh';
import type { IDashboardPageProps } from './type';

export const DashboardPage: React.FC<IDashboardPageProps> = ({
  title,
  subtitle,
  audience,
  backHref,
  backLabel = 'Home',
  withRefresh = true,
  children,
}) => {
  const header = (
    <div className="flex items-start justify-between mb-6">
      <div>
        {backHref ? (
          <Link
            to={backHref}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-600 transition-colors mb-2"
          >
            ← {backLabel}
          </Link>
        ) : null}
        <div className="flex items-center gap-2">
          {title ? (
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          ) : null}
          {audience ? (
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {audience}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {header}
        {withRefresh ? <Refresh>{children}</Refresh> : children}
      </div>
    </div>
  );
};
