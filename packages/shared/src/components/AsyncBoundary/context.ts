import { createContext, useContext } from 'react';
import type { IUseAsyncDataResult } from '@food/shared/hooks/useAsyncData/type';

/**
 * Shared context that `<AsyncBoundary>` reads from when used without explicit
 * `status` props. `<Service>` (apps/web) and any future declarative data
 * wrapper are expected to provide this context.
 *
 * Value is typed as `unknown` so the provider can hold any payload; consumers
 * cast via the generic on `useAsyncDataContext<T>()`.
 */
export const AsyncDataContext =
  createContext<IUseAsyncDataResult<unknown> | null>(null);

export function useAsyncDataContext<T = unknown>(): IUseAsyncDataResult<T> | null {
  return useContext(AsyncDataContext) as IUseAsyncDataResult<T> | null;
}
