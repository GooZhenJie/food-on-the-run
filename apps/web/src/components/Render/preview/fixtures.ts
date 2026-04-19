export type TFixturePreset = 'normal' | 'empty' | 'heavy' | 'edge';

export type TFixtureState = 'success' | 'loading' | 'error';

export interface IComponentFixtures<TData> {
  presets: Record<TFixturePreset, TData>;
  /** Optional error text shown when state === 'error' */
  errorMessage?: string;
}
