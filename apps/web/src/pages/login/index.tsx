import React, { useEffect, useState } from 'react';
import { Render } from '@/components/Render';
import { LOGIN_PAGE_SCHEMA } from './schema';
import { fetchPublicPageSchema } from '@/services/schemas';
import type { ISchemaNode } from '@/components/Render/type';

export default function LoginPage() {
  const [schema, setSchema] = useState<ISchemaNode | null>(null);

  useEffect(() => {
    fetchPublicPageSchema('/login')
      .then((res) => setSchema(res.schema_data))
      .catch(() => setSchema(LOGIN_PAGE_SCHEMA));
  }, []);

  if (!schema) return null;
  return <Render schema={schema} />;
}
