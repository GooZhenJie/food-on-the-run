import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRefreshRegister } from '@/components/Refresh/context';
import { ServiceContext } from './context';
import type { IServiceProps } from './type';

export const Service: React.FC<IServiceProps> = ({
  api,
  deps = [],
  interval,
  beforeRequest,
  formatData,
  children,
}) => {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { register, unregister, reportSuccess, reportFailure } = useRefreshRegister(api);

  const fetchData = useCallback(
    async (silent = false) => {
      if (beforeRequest && beforeRequest() === false) return;

      if (!silent) setLoading(true);
      setError(null);

      try {
        const res = await fetch(api);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        if (!mountedRef.current) return;
        const processed = formatData ? formatData(raw) : raw;
        setData(processed);
        reportSuccess(api);
      } catch (e) {
        if (!mountedRef.current) return;
        const msg = e instanceof Error ? e.message : 'Unknown error';
        setError(msg);
        reportFailure(api);
      } finally {
        if (mountedRef.current && !silent) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, ...deps],
  );

  useEffect(() => {
    mountedRef.current = true;
    register(api, fetchData);
    fetchData();

    if (interval && interval > 0) {
      timerRef.current = setInterval(() => fetchData(true), interval);
    }

    return () => {
      mountedRef.current = false;
      unregister(api);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, ...deps]);

  return (
    <ServiceContext.Provider value={{ data, loading, error, refresh: () => fetchData() }}>
      {children}
    </ServiceContext.Provider>
  );
};
