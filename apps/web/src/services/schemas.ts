import { request } from 'umi';
import type { ISchemaNode } from '@/components/Render/type';

export interface IPublicPageSchema {
  id: number;
  key: string;
  current_version: number;
  schema_data: ISchemaNode | null;
  created_at: string;
  updated_at: string;
}

export function fetchPublicPageSchema(key: string): Promise<IPublicPageSchema> {
  return request<IPublicPageSchema>('/public/schemas', { params: { key } });
}
