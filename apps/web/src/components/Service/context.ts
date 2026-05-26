import { useAsyncDataContext } from '@food/shared/components/AsyncBoundary/context';
import type { IServiceContextValue } from './type';

const IDLE_VALUE: IServiceContextValue = {
  status: 'idle',
  data: undefined,
  isRefetching: false,
  refetch: async () => {},
  loading: false,
  error: null,
  refresh: () => {},
};

export function useServiceData<T = unknown>(): IServiceContextValue<T> {
  const ctx = useAsyncDataContext<T>();
  if (!ctx) return IDLE_VALUE as IServiceContextValue<T>;

  return {
    status: ctx.status,
    data: ctx.data,
    isRefetching: ctx.isRefetching,
    refetch: ctx.refetch,
    loading: ctx.status === 'loading',
    error: ctx.error ? ctx.error.message : null,
    refresh: (): void => {
      void ctx.refetch();
    },
  };
}
