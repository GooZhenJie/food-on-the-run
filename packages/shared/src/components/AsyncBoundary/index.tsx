import React, { useContext, type ReactNode } from 'react';
import { Button, Empty, Result, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { cn } from '@food/shared';
import { AsyncDataContext } from './context';
import type { AsyncStatus, IAsyncBoundaryProps } from './type';

const DEFAULT_LOADING: ReactNode = (
  <div className="flex items-center justify-center py-12 w-full">
    <Spin />
  </div>
);

const DEFAULT_EMPTY: ReactNode = (
  <div className="flex items-center justify-center py-12 w-full">
    <Empty />
  </div>
);

const renderDefaultError = (error: Error, onRetry?: () => void): ReactNode => (
  <div className="flex items-center justify-center py-12 w-full">
    <Result
      status="error"
      title="Something went wrong"
      subTitle={error.message}
      extra={
        onRetry ? (
          <Button icon={<ReloadOutlined />} onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    />
  </div>
);

export const AsyncBoundary: React.FC<IAsyncBoundaryProps> = (props) => {
  const {
    status: statusProp,
    error: errorProp,
    onRetry: onRetryProp,
    isRefetching: isRefetchingProp,
    children,
    idleFallback = null,
    loadingFallback = DEFAULT_LOADING,
    emptyFallback = DEFAULT_EMPTY,
    errorFallback,
    keepPreviousData = false,
    className,
    'aria-label': ariaLabel,
  } = props;

  const ctx = useContext(AsyncDataContext);
  const usingContext = statusProp === undefined;

  if (
    process.env.NODE_ENV !== 'production' &&
    usingContext &&
    !ctx
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      '[AsyncBoundary] No `status` prop and no <Service>/<AsyncDataContext> ancestor found. Rendering idleFallback.',
    );
  }

  const status: AsyncStatus =
    statusProp ?? (ctx?.status ?? 'idle');
  const error: Error | null = errorProp ?? ctx?.error ?? null;
  const onRetry: (() => void) | undefined =
    onRetryProp ?? (ctx ? (): void => void ctx.refetch() : undefined);
  const isRefetching: boolean =
    isRefetchingProp ?? ctx?.isRefetching ?? false;

  const ariaLive =
    status === 'loading' || status === 'error' ? 'polite' : undefined;

  const wrap = (node: ReactNode): JSX.Element => (
    <div
      className={cn('w-full', className)}
      aria-live={ariaLive}
      aria-label={ariaLabel}
    >
      {node}
    </div>
  );

  if (status === 'idle') return wrap(idleFallback);
  if (status === 'loading') return wrap(loadingFallback);
  if (status === 'error') {
    const err = error ?? new Error('Unknown error');
    if (typeof errorFallback === 'function') {
      return wrap(errorFallback(err, onRetry));
    }
    if (errorFallback !== undefined) return wrap(errorFallback);
    return wrap(renderDefaultError(err, onRetry));
  }
  if (status === 'empty') return wrap(emptyFallback);

  if (isRefetching && keepPreviousData) {
    return wrap(
      <div className="relative">
        {children}
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 pointer-events-none">
          <Spin size="small" />
        </div>
      </div>,
    );
  }

  return wrap(children);
};
