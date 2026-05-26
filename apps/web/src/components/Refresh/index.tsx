import React, { useCallback, useRef, useState } from 'react';
import {
  SyncOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  ReloadOutlined,
} from '@ant-design/icons';
import { RefreshContext } from './context';

interface IRefreshProps {
  children: React.ReactNode;
}

type TStatus = 'idle' | 'refreshing' | 'success' | 'error';

export const Refresh: React.FC<IRefreshProps> = ({ children }) => {
  const fetchersRef = useRef<Map<string, () => void>>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const failedRef = useRef<Set<string>>(new Set());
  const [status, setStatus] = useState<TStatus>('idle');

  const register = useCallback((key: string, fetcher: () => void) => {
    fetchersRef.current.set(key, fetcher);
  }, []);

  const unregister = useCallback((key: string) => {
    fetchersRef.current.delete(key);
    pendingRef.current.delete(key);
    failedRef.current.delete(key);
  }, []);

  const checkComplete = useCallback(() => {
    if (pendingRef.current.size === 0) {
      setStatus(failedRef.current.size > 0 ? 'error' : 'success');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, []);

  const reportSuccess = useCallback(
    (key: string) => {
      pendingRef.current.delete(key);
      checkComplete();
    },
    [checkComplete],
  );

  const reportFailure = useCallback(
    (key: string) => {
      pendingRef.current.delete(key);
      failedRef.current.add(key);
      checkComplete();
    },
    [checkComplete],
  );

  const triggerRefreshAll = useCallback(() => {
    const keys = Array.from(fetchersRef.current.keys());
    if (keys.length === 0) return;

    pendingRef.current = new Set(keys);
    failedRef.current = new Set();
    setStatus('refreshing');

    keys.forEach((key) => {
      const fetcher = fetchersRef.current.get(key);
      fetcher?.();
    });
  }, []);

  const statusNode: Record<TStatus, React.ReactNode> = {
    idle: null,
    refreshing: (
      <>
        <SyncOutlined spin /> Refreshing...
      </>
    ),
    success: (
      <>
        <CheckCircleFilled /> All data up to date
      </>
    ),
    error: (
      <>
        <ExclamationCircleFilled /> Some requests failed
      </>
    ),
  };

  const statusColor: Record<TStatus, string> = {
    idle: '',
    refreshing: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    error: 'bg-red-50 text-red-600',
  };

  return (
    <RefreshContext.Provider
      value={{ register, unregister, reportSuccess, reportFailure, triggerRefreshAll }}
    >
      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex items-center gap-3">
          {status !== 'idle' && (
            <span
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${statusColor[status]}`}
            >
              {statusNode[status]}
            </span>
          )}
          <button
            onClick={triggerRefreshAll}
            disabled={status === 'refreshing'}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ReloadOutlined spin={status === 'refreshing'} />
            Refresh All
          </button>
        </div>
      </div>
      {children}
    </RefreshContext.Provider>
  );
};
