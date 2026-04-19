import type { ISchemaNode } from '@/components/Render/type';
import type {
  TFixturePreset,
  TFixtureState,
} from '@/components/Render/preview/fixtures';
import type {
  TPreviewAuth,
  TPreviewDevice,
  TPreviewLocale,
} from '@/components/Render/preview/context';
import type { IPreviewQueryParams } from './type';

const PRESETS: TFixturePreset[] = ['normal', 'empty', 'heavy', 'edge'];
const STATES: TFixtureState[] = ['success', 'loading', 'error'];
const AUTHS: TPreviewAuth[] = ['guest', 'logged-in'];
const LOCALES: TPreviewLocale[] = ['en', 'zh', 'ms'];
const DEVICES: TPreviewDevice[] = ['mobile', 'tablet', 'desktop'];

const pickOr = <T extends string>(value: string | null, allowed: T[], fallback: T): T => {
  return (allowed as string[]).includes(value ?? '') ? (value as T) : fallback;
};

/** Safely decodes a base64 (URL-safe tolerant) JSON string back into a schema. */
const decodeSchema = (encoded: string | null): ISchemaNode | null => {
  if (!encoded) return null;
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(normalized)));
    const parsed = JSON.parse(json) as ISchemaNode;
    if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const parsePreviewSearch = (search: string): IPreviewQueryParams => {
  const params = new URLSearchParams(search);
  return {
    schema: decodeSchema(params.get('schema')),
    preset: pickOr(params.get('preset'), PRESETS, 'normal'),
    state: pickOr(params.get('state'), STATES, 'success'),
    auth: pickOr(params.get('auth'), AUTHS, 'guest'),
    locale: pickOr(params.get('locale'), LOCALES, 'en'),
    device: pickOr(params.get('device'), DEVICES, 'mobile'),
  };
};

export const deviceFrameClass = (device: TPreviewDevice): string => {
  switch (device) {
    case 'mobile':
      return 'mx-auto w-full max-w-[375px] min-h-screen bg-white shadow-sm';
    case 'tablet':
      return 'mx-auto w-full max-w-[768px] min-h-screen bg-white shadow-sm';
    case 'desktop':
    default:
      return 'mx-auto w-full min-h-screen bg-white';
  }
};
