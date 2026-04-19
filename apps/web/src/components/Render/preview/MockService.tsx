import React, { useMemo } from 'react';
import { ServiceContext } from '@/components/Service/context';
import type { IComponentFixtures, TFixturePreset, TFixtureState } from './fixtures';

interface IMockServiceProps<TData> {
  fixtures: IComponentFixtures<TData>;
  preset: TFixturePreset;
  state: TFixtureState;
  children: React.ReactNode;
}

/**
 * Drop-in replacement for <Service> during preview mode.
 * Reads from the component's fixtures registry instead of calling fetch.
 */
export const MockService = <TData,>({
  fixtures,
  preset,
  state,
  children,
}: IMockServiceProps<TData>): React.ReactElement => {
  const value = useMemo(() => {
    if (state === 'loading') {
      return { data: null, loading: true, error: null, refresh: () => {} };
    }
    if (state === 'error') {
      return {
        data: null,
        loading: false,
        error: fixtures.errorMessage ?? 'Preview error',
        refresh: () => {},
      };
    }
    return {
      data: fixtures.presets[preset] as unknown,
      loading: false,
      error: null,
      refresh: () => {},
    };
  }, [fixtures, preset, state]);

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};
