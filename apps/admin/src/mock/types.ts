export interface IMockRequest {
  body?: Record<string, unknown>;
  query: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  url: string;
  method: string;
}

export interface IMockResponse {
  status: (code: number) => IMockResponse;
  json: (body: unknown) => IMockResponse;
  end: () => IMockResponse;
  send: (body: unknown) => IMockResponse;
}

export type MockHandler = (req: IMockRequest, res: IMockResponse) => unknown;

export const getQueryString = (
  query: IMockRequest['query'],
  key: string,
): string | undefined => {
  const val = query[key];
  if (Array.isArray(val)) return val[0];
  return val;
};

export const getQueryInt = (
  query: IMockRequest['query'],
  key: string,
  fallback: number,
): number => {
  const raw = getQueryString(query, key);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

export const paginate = <T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; page: number; page_size: number } => {
  const total = items.length;
  const start = Math.max(0, (page - 1) * pageSize);
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    total,
    page,
    page_size: pageSize,
  };
};

export const sortBy = <T>(
  items: T[],
  accessor: (row: T) => string | number | Date | null | undefined,
  order: 'asc' | 'desc',
): T[] => {
  const copy = [...items];
  copy.sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (av instanceof Date && bv instanceof Date) {
      return av.getTime() - bv.getTime();
    }
    return av < bv ? -1 : 1;
  });
  return order === 'asc' ? copy : copy.reverse();
};
