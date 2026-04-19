import React, { useMemo } from 'react';
import { Render } from '@/components/Render';
import {
  PreviewContext,
  type IPreviewState,
} from '@/components/Render/preview/context';
import { usePreviewState } from './hooks';
import { deviceFrameClass } from './utils';

export default function PreviewPage() {
  const { schema, preset, state, auth, locale, device } = usePreviewState();

  const contextValue = useMemo<IPreviewState>(
    () => ({
      enabled: true,
      preset,
      dataState: state,
      auth,
      locale,
      device,
    }),
    [preset, state, auth, locale, device],
  );

  return (
    <PreviewContext.Provider value={contextValue}>
      <div className="bg-gray-100 min-h-screen py-4">
        <div className={deviceFrameClass(device)}>
          {schema ? (
            <Render schema={schema} />
          ) : (
            <div className="text-sm text-gray-400 text-center py-20">
              No schema provided. Pass <code>?schema=&lt;base64 JSON&gt;</code> or send a
              <code> preview:update </code> message.
            </div>
          )}
        </div>
      </div>
    </PreviewContext.Provider>
  );
}
