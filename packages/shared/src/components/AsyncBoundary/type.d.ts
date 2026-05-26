import type { ReactNode } from 'react';
import type { AsyncStatus } from '@food/shared/hooks/useAsyncData/type';

export type { AsyncStatus };

export type TErrorFallback =
  | ReactNode
  | ((error: Error, retry?: () => void) => ReactNode);

export interface IAsyncBoundaryProps {
  /**
   * Imperative mode. Omit to fall back to the nearest <Service> via ServiceContext.
   * Providing `status` disables the context fallback.
   */
  status?: AsyncStatus;
  error?: Error | null;
  onRetry?: () => void;
  /** Set true only while a background refetch is in flight and prior data exists. */
  isRefetching?: boolean;

  children: ReactNode;

  idleFallback?: ReactNode;
  loadingFallback?: ReactNode;
  emptyFallback?: ReactNode;
  errorFallback?: TErrorFallback;

  /**
   * Keep rendering children during a background refetch with an overlay spinner
   * instead of swapping back to the loading fallback.
   */
  keepPreviousData?: boolean;

  className?: string;
  'aria-label'?: string;
}
