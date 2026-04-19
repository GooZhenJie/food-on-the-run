import type { IPreviewSettings, TPreviewDevice } from './type';

/**
 * Umi `define` replaces `WEB_APP_URL_CONST` at build time. The global is
 * declared in `apps/admin/typings.d.ts`; fallback is only used if the define
 * was somehow stripped (e.g. during tests).
 */
export const WEB_APP_URL: string =
  typeof WEB_APP_URL_CONST !== 'undefined' && WEB_APP_URL_CONST
    ? WEB_APP_URL_CONST
    : 'http://localhost:8000';

/** Unicode-safe base64: supports schemas containing emoji or non-ASCII text. */
const encodeSchema = (schema: unknown): string => {
  const json = JSON.stringify(schema ?? null);
  const utf8 = unescape(encodeURIComponent(json));
  return btoa(utf8);
};

export const buildPreviewUrl = (
  schema: unknown,
  settings: IPreviewSettings,
): string => {
  const url = new URL('/__preview', WEB_APP_URL);
  url.searchParams.set('schema', encodeSchema(schema));
  url.searchParams.set('preset', settings.preset);
  url.searchParams.set('state', settings.dataState);
  url.searchParams.set('auth', settings.auth);
  url.searchParams.set('locale', settings.locale);
  url.searchParams.set('device', settings.device);
  return url.toString();
};

export const previewIframeWidth = (device: TPreviewDevice): number => {
  switch (device) {
    case 'mobile':
      return 390;
    case 'tablet':
      return 820;
    case 'desktop':
    default:
      return 1200;
  }
};

export const DEFAULT_PREVIEW_SETTINGS: IPreviewSettings = {
  preset: 'normal',
  dataState: 'success',
  auth: 'guest',
  locale: 'en',
  device: 'mobile',
};

export { encodeSchema };
