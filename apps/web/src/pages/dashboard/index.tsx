import React from 'react';
import { AsyncBoundary } from '@food/shared/components/AsyncBoundary';
import { useAsyncData } from '@food/shared/hooks/useAsyncData';
import { Render } from '@/components/Render';
import { fetchPublicPageSchema } from '@/services/schemas';
import { DASHBOARD_PAGE_SCHEMA } from './schema';
import type { ISchemaNode } from '@/components/Render/type';

const LOADING_FALLBACK = (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const query = useAsyncData<ISchemaNode>({
    fetcher: async () => {
      try {
        const res = await fetchPublicPageSchema('/dashboard');
        return res.schema_data;
      } catch {
        return DASHBOARD_PAGE_SCHEMA as ISchemaNode;
      }
    },
  });

  return (
    <AsyncBoundary
      status={query.status}
      error={query.error}
      onRetry={query.refetch}
      isRefetching={query.isRefetching}
      loadingFallback={LOADING_FALLBACK}
    >
      {query.data ? <Render schema={query.data} /> : null}
    </AsyncBoundary>
  );
}
