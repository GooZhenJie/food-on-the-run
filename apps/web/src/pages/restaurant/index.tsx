import React, { useEffect, useState } from 'react';
import { Link } from 'umi';
import { Render } from '@/components/Render';
import { RESTAURANT_PAGE_SCHEMA } from './schema';
import { fetchPublicPageSchema } from '@/services/schemas';
import type { ISchemaNode } from '@/components/Render/type';

export default function RestaurantPage() {
  const [schema, setSchema] = useState<ISchemaNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicPageSchema('/restaurant')
      .then((res) => {
        setSchema(res.schema_data);
        setLoading(false);
      })
      .catch(() => {
        setSchema(RESTAURANT_PAGE_SCHEMA as ISchemaNode);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-600 transition-colors mb-6"
        >
          ← Back to restaurants
        </Link>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-200 animate-pulse h-40" />
            ))}
          </div>
        ) : schema ? (
          <>
            <div className="text-xs text-gray-400 mb-4 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                🏗️ Schema-driven
              </span>
              <span>Page layout is rendered from a JSON config — no hardcoded structure.</span>
            </div>
            <Render schema={schema} />
          </>
        ) : null}
      </div>
    </div>
  );
}
