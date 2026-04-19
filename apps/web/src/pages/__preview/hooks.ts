import { useEffect, useState } from 'react';
import { parsePreviewSearch } from './utils';
import type { IPreviewQueryParams, TPreviewMessage } from './type';

/**
 * Initializes the preview state from URL params, then subscribes to
 * `postMessage` updates from the embedding parent window so the admin
 * Toolbar can mutate preview state without reloading the iframe.
 */
export const usePreviewState = (): IPreviewQueryParams => {
  const [state, setState] = useState<IPreviewQueryParams>(() =>
    parsePreviewSearch(typeof window === 'undefined' ? '' : window.location.search),
  );

  useEffect(() => {
    const handler = (event: MessageEvent<TPreviewMessage>) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'preview:update') return;
      setState((prev) => ({
        ...prev,
        ...data.payload,
        schema: data.payload.schema ?? prev.schema,
      }));
    };

    window.addEventListener('message', handler);
    try {
      window.parent?.postMessage({ type: 'preview:ready' } satisfies TPreviewMessage, '*');
    } catch {
      /* ignore */
    }
    return () => window.removeEventListener('message', handler);
  }, []);

  return state;
};
