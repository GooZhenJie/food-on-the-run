import { clearAuth, getAccessToken } from '@/utils/auth';
import { history } from 'umi';

interface RequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: TBody;
  signal?: AbortSignal;
}

/**
 * Minimal fetch wrapper for the admin console.
 * All admin endpoints live under /api/admin/*.
 */
export async function adminRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const { method = 'GET', body, signal } = options;

  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    signal,
  });

  if (res.status === 401 && path.startsWith('/api/admin/')) {
    clearAuth();
    history.push('/login');
  }

  if (!res.ok) {
    let messageText = `Request failed with status ${res.status}`;
    try {
      const errBody = await res.clone().json();
      if (errBody?.error) messageText = errBody.error;
      else if (errBody?.message) messageText = errBody.message;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) messageText = text;
    }
    throw new Error(messageText);
  }

  if (res.status === 204) {
    return undefined as TResponse;
  }
  return (await res.json()) as TResponse;
}
