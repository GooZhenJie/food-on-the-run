import React, { useEffect } from 'react';
import { AsyncDataContext } from '@food/shared/components/AsyncBoundary/context';
import { useAsyncData } from '@food/shared/hooks/useAsyncData';
import { useRefreshRegister } from '@/components/Refresh/context';
import type { IServiceProps } from './type';

export const Service: React.FC<IServiceProps> = ({
  api,
  deps = [],
  interval,
  beforeRequest,
  formatData,
  children,
}) => {
  const { register, unregister, reportSuccess, reportFailure } =
    useRefreshRegister(api);
  const enabled = beforeRequest ? beforeRequest() !== false : true;

  const query = useAsyncData<unknown>({
    fetcher: async (signal) => {
      const res = await fetch(api, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw: unknown = await res.json();
      return formatData ? formatData(raw) : raw;
    },
    deps: [api, ...deps],
    enabled,
    interval,
    onSuccess: () => reportSuccess(api),
    onError: () => reportFailure(api),
  });

  useEffect(() => {
    register(api, (): void => {
      void query.refetch();
    });
    return () => unregister(api);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  return (
    <AsyncDataContext.Provider value={query}>
      {children}
    </AsyncDataContext.Provider>
  );
};
