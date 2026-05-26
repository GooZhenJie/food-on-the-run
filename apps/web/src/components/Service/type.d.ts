import type { AsyncStatus } from '@food/shared/hooks/useAsyncData/type';

export interface IServiceContextValue<T = unknown> {
  status: AsyncStatus;
  data: T | undefined;
  isRefetching: boolean;
  refetch: () => Promise<void>;

  /** @deprecated use `status === 'loading'` instead. Kept for back-compat. */
  loading: boolean;
  /** @deprecated kept as a string message for back-compat; use a parent AsyncBoundary for richer error UX. */
  error: string | null;
  /** @deprecated alias of `refetch`; kept for back-compat. */
  refresh: () => void;
}

export interface IServiceProps {
  api: string;
  /** Re-fetch when any value in this array changes */
  deps?: unknown[];
  /** Polling interval in milliseconds. Omit to disable polling. */
  interval?: number;
  /** Return false to abort the request */
  beforeRequest?: () => boolean;
  /** Transform the raw response before storing */
  formatData?: (raw: unknown) => unknown;
  children: React.ReactNode;
}
