import { adminRequest } from './request';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
}

export interface PageSchema {
  id: number;
  key: string;
  current_version: number;
  schema_data: unknown;
  created_at: string;
  updated_at: string;
  last_updated_by?: UserSummary;
}

export interface PageSchemaVersion {
  id: number;
  page_schema_id: number;
  version: number;
  schema_data: unknown;
  note: string;
  creator_id: number;
  created_at: string;
}

export interface ListPageSchemasResponse {
  items: PageSchema[];
}

export interface ListPageSchemaVersionsResponse {
  items: PageSchemaVersion[];
}

export interface PublishPageSchemaRequest {
  key: string;
  schema_data: unknown;
  note?: string;
}

export interface PublishPageSchemaResponse {
  schema: PageSchema;
  new_version: PageSchemaVersion;
  previous_version?: PageSchemaVersion;
}

export function listPageSchemas(): Promise<ListPageSchemasResponse> {
  return adminRequest<ListPageSchemasResponse>('/api/admin/schemas');
}

export function getPageSchema(key: string): Promise<PageSchema> {
  const qs = new URLSearchParams({ key }).toString();
  return adminRequest<PageSchema>(`/api/admin/schemas?${qs}`);
}

export function listPageSchemaVersions(
  key: string,
): Promise<ListPageSchemaVersionsResponse> {
  const qs = new URLSearchParams({ key }).toString();
  return adminRequest<ListPageSchemaVersionsResponse>(
    `/api/admin/schemas/versions?${qs}`,
  );
}

export function getPageSchemaVersion(
  key: string,
  version: number,
): Promise<PageSchemaVersion> {
  const qs = new URLSearchParams({ key, version: String(version) }).toString();
  return adminRequest<PageSchemaVersion>(`/api/admin/schemas/versions?${qs}`);
}

export function publishPageSchema(
  body: PublishPageSchemaRequest,
): Promise<PublishPageSchemaResponse> {
  return adminRequest<PublishPageSchemaResponse, PublishPageSchemaRequest>(
    '/api/admin/schemas/publish',
    { method: 'POST', body },
  );
}

export function deletePageSchema(key: string): Promise<PageSchema> {
  const qs = new URLSearchParams({ key }).toString();
  return adminRequest<PageSchema>(`/api/admin/schemas?${qs}`, {
    method: 'DELETE',
  });
}
