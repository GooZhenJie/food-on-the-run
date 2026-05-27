import React from 'react';
import { Link } from 'umi';
import { AppstoreOutlined } from '@ant-design/icons';
import { AsyncBoundary } from '@food/shared/components/AsyncBoundary';
import { useAsyncData } from '@food/shared/hooks/useAsyncData';
import { Render } from '@/components/Render';
import { RESTAURANT_PAGE_SCHEMA } from './schema';
import { fetchPublicPageSchema } from '@/services/schemas';
import type { ISchemaNode } from '@/components/Render/type';

const LOADING_FALLBACK = (
  <div className="flex flex-col gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-2xl bg-gray-200 animate-pulse h-40" />
    ))}
  </div>
);

export default function RestaurantPage() {
  const query = useAsyncData<ISchemaNode>({
    fetcher: async () => {
      try {
        const res = await fetchPublicPageSchema('/restaurant');
        return res.schema_data ?? (RESTAURANT_PAGE_SCHEMA as ISchemaNode);
      } catch {
        return RESTAURANT_PAGE_SCHEMA as ISchemaNode;
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-600 transition-colors mb-6"
        >
          ← Back to restaurants
        </Link>

        <AsyncBoundary
          status={query.status}
          error={query.error}
          onRetry={query.refetch}
          isRefetching={query.isRefetching}
          loadingFallback={LOADING_FALLBACK}
        >
          <div className="text-xs text-gray-400 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              <AppstoreOutlined />
              Schema-driven
            </span>
            <span>Page layout is rendered from a JSON config — no hardcoded structure.</span>
          </div>
          {query.data ? <Render schema={query.data} /> : null}
        </AsyncBoundary>
      </div>
    </div>
  );
}
