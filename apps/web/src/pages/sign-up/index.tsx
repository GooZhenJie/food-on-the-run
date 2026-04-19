import React, { useEffect, useState } from 'react';
import { Render } from '@/components/Render';
import { SIGN_UP_PAGE_SCHEMA } from './schema';
import { fetchPublicPageSchema } from '@/services/schemas';
import type { ISchemaNode } from '@/components/Render/type';

export default function SignUpPage() {
  const [schema, setSchema] = useState<ISchemaNode | null>(null);

  useEffect(() => {
    fetchPublicPageSchema('/sign-up')
      .then((res) => setSchema(res.schema_data))
      .catch(() => setSchema(SIGN_UP_PAGE_SCHEMA));
  }, []);

  if (!schema) return null;
  return <Render schema={schema} />;
}
