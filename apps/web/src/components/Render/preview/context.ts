import { createContext, useContext } from 'react';
import type { TFixturePreset, TFixtureState } from './fixtures';

export type TPreviewAuth = 'guest' | 'logged-in';
export type TPreviewLocale = 'en' | 'zh' | 'ms';
export type TPreviewDevice = 'mobile' | 'tablet' | 'desktop';

export interface IPreviewState {
  enabled: boolean;
  preset: TFixturePreset;
  dataState: TFixtureState;
  auth: TPreviewAuth;
  locale: TPreviewLocale;
  device: TPreviewDevice;
}

export const DEFAULT_PREVIEW_STATE: IPreviewState = {
  enabled: false,
  preset: 'normal',
  dataState: 'success',
  auth: 'guest',
  locale: 'en',
  device: 'mobile',
};

export const PreviewContext =
  createContext<IPreviewState>(DEFAULT_PREVIEW_STATE);

export const usePreview = (): IPreviewState => useContext(PreviewContext);
