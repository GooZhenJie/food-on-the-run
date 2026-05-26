import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AsyncStatus,
  IUseAsyncDataOptions,
  IUseAsyncDataResult,
} from './type';

const defaultIsEmpty = <T,>(data: T): boolean => {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  return false;
};

export function useAsyncData<T>(
  options: IUseAsyncDataOptions<T>,
): IUseAsyncDataResult<T> {
  const {
    fetcher,
    deps = [],
    enabled = true,
    isEmpty = defaultIsEmpty,
    interval,
    onSuccess,
    onError,
  } = options;

  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);

  /** Refs for the callbacks so their identity doesn't force the main effect to re-run. */
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const isEmptyRef = useRef(isEmpty);
  isEmptyRef.current = isEmpty;

  const runFetch = useCallback(async (): Promise<void> => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const myId = ++fetchIdRef.current;

    if (!mountedRef.current) return;
    setIsFetching(true);

    try {
      const result = await fetcherRef.current(ctrl.signal);
      if (!mountedRef.current || fetchIdRef.current !== myId) return;
      setDataState(result);
      setError(null);
      onSuccessRef.current?.(result);
    } catch (e) {
      if (!mountedRef.current || fetchIdRef.current !== myId) return;
      if (ctrl.signal.aborted) return;
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      onErrorRef.current?.(err);
    } finally {
      if (mountedRef.current && fetchIdRef.current === myId) {
        setIsFetching(false);
      }
    }
  }, []);

  const refetch = useCallback((): Promise<void> => runFetch(), [runFetch]);

  const setData = useCallback(
    (updater: (prev: T | undefined) => T): void => {
      setDataState((prev) => updater(prev));
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    void runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, runFetch, ...deps]);

  useEffect(() => {
    if (!enabled || !interval || interval <= 0) return;
    const timer = setInterval(() => {
      void runFetch();
    }, interval);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval, runFetch, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const status: AsyncStatus = (() => {
    if (data === undefined && !error) {
      if (!enabled) return 'idle';
      if (isFetching) return 'loading';
      return 'idle';
    }
    if (error && data === undefined) return 'error';
    if (data !== undefined && isEmptyRef.current(data)) return 'empty';
    if (data !== undefined) return 'success';
    return 'idle';
  })();

  const isRefetching = isFetching && data !== undefined;

  return {
    status,
    data,
    error,
    isRefetching,
    refetch,
    setData,
  };
}
