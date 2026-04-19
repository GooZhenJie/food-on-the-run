import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  IPreviewSettings,
  IPreviewUpdatePayload,
  TPreviewMessage,
} from './type';
import { DEFAULT_PREVIEW_SETTINGS } from './utils';

interface IUsePreviewIframeArgs {
  schema: unknown;
  open: boolean;
}

interface IUsePreviewIframeReturn {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  settings: IPreviewSettings;
  ready: boolean;
  updateSettings: (next: Partial<IPreviewSettings>) => void;
  sendSchemaUpdate: (schema: unknown) => void;
}

/**
 * Owns the preview settings state and the cross-frame postMessage channel.
 * Auto-pushes setting changes into the iframe so the user sees live updates
 * without reloading.
 */
export const usePreviewIframe = ({
  schema,
  open,
}: IUsePreviewIframeArgs): IUsePreviewIframeReturn => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [settings, setSettings] = useState<IPreviewSettings>(
    DEFAULT_PREVIEW_SETTINGS,
  );
  const [ready, setReady] = useState(false);

  const postMessage = useCallback((payload: IPreviewUpdatePayload) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const msg: TPreviewMessage = { type: 'preview:update', payload };
    win.postMessage(msg, '*');
  }, []);

  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const handler = (event: MessageEvent<TPreviewMessage>) => {
      if (event.data?.type === 'preview:ready') {
        setReady(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [open]);

  useEffect(() => {
    if (!ready) return;
    postMessage({
      schema,
      preset: settings.preset,
      state: settings.dataState,
      auth: settings.auth,
      locale: settings.locale,
      device: settings.device,
    });
  }, [ready, schema, settings, postMessage]);

  const updateSettings = useCallback((next: Partial<IPreviewSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
  }, []);

  const sendSchemaUpdate = useCallback(
    (nextSchema: unknown) => {
      postMessage({ schema: nextSchema });
    },
    [postMessage],
  );

  return { iframeRef, settings, ready, updateSettings, sendSchemaUpdate };
};
