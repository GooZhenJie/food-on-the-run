import type { DependencyList } from 'react';

/**
 * Canonical async UI status. All three primitives in the FOTR data layer
 * (useAsyncData, <Service>, <AsyncBoundary>) speak this contract.
 */
export type AsyncStatus = 'idle' | 'loading' | 'error' | 'empty' | 'success';

export interface IUseAsyncDataOptions<T> {
  /**
   * Async producer for the data. Receives an AbortSignal so long-running
   * requests can be cancelled on deps change / unmount.
   */
  fetcher: (signal: AbortSignal) => Promise<T>;

  /** Re-fetch whenever any value in this list changes (shallow compare). */
  deps?: DependencyList;

  /** When false, suppresses auto-fetch. Default: true. */
  enabled?: boolean;

  /**
   * Override the empty-data check. Default:
   * `Array.isArray(d) ? d.length === 0 : d == null`.
   */
  isEmpty?: (data: T) => boolean;

  /** Poll every N ms. Omit to disable polling. */
  interval?: number;

  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface IUseAsyncDataResult<T> {
  /** Derived from { enabled, in-flight, error, data, isEmpty }. */
  status: AsyncStatus;
  data: T | undefined;
  error: Error | null;
  /** True only when a background refetch is in flight and previous data exists. */
  isRefetching: boolean;
  /** Manually trigger a refetch. Safe to call repeatedly; in-flight is cancelled. */
  refetch: () => Promise<void>;
  /** Optimistic update helper. */
  setData: (updater: (prev: T | undefined) => T) => void;
}
