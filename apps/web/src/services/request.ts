const BASE_URL = '/api';

interface IRequestOptions extends RequestInit {
  params?: Record<string, string | number>;
  data?: unknown;
}

async function request<T>(path: string, options: IRequestOptions = {}): Promise<T> {
  const { params, data, headers: customHeaders, ...init } = options;
  let url = `${BASE_URL}${path}`;

  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    );
    url += `?${qs.toString()}`;
  }

  // Build headers with auth token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const token = localStorage.getItem('__fotr_auth_token__');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    body: data !== undefined ? JSON.stringify(data) : init.body,
    ...init,
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const errBody = await res.json();
      if (errBody?.error) message = errBody.error;
      else if (errBody?.message) message = errBody.message;
    } catch {
      /* ignore parse error */
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export default request;
