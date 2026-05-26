import React, { useMemo } from 'react';
import { AsyncDataContext } from '@food/shared/components/AsyncBoundary/context';
import type { IUseAsyncDataResult } from '@food/shared/hooks/useAsyncData/type';
import type { IComponentFixtures, TFixturePreset, TFixtureState } from './fixtures';

interface IMockServiceProps<TData> {
  fixtures: IComponentFixtures<TData>;
  preset: TFixturePreset;
  state: TFixtureState;
  children: React.ReactNode;
}

/**
 * Drop-in replacement for <Service> during preview mode.
 * Reads from the component's fixtures registry instead of calling fetch,
 * and publishes the same AsyncDataContext so downstream AsyncBoundary /
 * useServiceData() consumers behave identically to production.
 */
export const MockService = <TData,>({
  fixtures,
  preset,
  state,
  children,
}: IMockServiceProps<TData>): React.ReactElement => {
  const value = useMemo<IUseAsyncDataResult<unknown>>(() => {
    const noop = async (): Promise<void> => {};
    const noopSetData = (): void => {};

    if (state === 'loading') {
      return {
        status: 'loading',
        data: undefined,
        error: null,
        isRefetching: false,
        refetch: noop,
        setData: noopSetData,
      };
    }
    if (state === 'error') {
      return {
        status: 'error',
        data: undefined,
        error: new Error(fixtures.errorMessage ?? 'Preview error'),
        isRefetching: false,
        refetch: noop,
        setData: noopSetData,
      };
    }

    const data = fixtures.presets[preset] as unknown;
    const empty = Array.isArray(data)
      ? data.length === 0
      : data === null || data === undefined;

    return {
      status: empty ? 'empty' : 'success',
      data,
      error: null,
      isRefetching: false,
      refetch: noop,
      setData: noopSetData,
    };
  }, [fixtures, preset, state]);

  return (
    <AsyncDataContext.Provider value={value}>
      {children}
    </AsyncDataContext.Provider>
  );
};
