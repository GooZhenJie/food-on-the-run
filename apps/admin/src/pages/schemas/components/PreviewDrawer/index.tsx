import { ReloadOutlined } from '@ant-design/icons';
import { Button, Drawer, Space, Spin, Tag } from 'antd';
import React, { useMemo } from 'react';
import { PreviewToolbar } from './Toolbar';
import { usePreviewIframe } from './hooks';
import type { IPreviewDrawerProps } from './type';
import { buildPreviewUrl, previewIframeWidth } from './utils';

export const PreviewDrawer: React.FC<IPreviewDrawerProps> = ({
  open,
  title,
  schema,
  onClose,
}) => {
  const { iframeRef, settings, ready, updateSettings } = usePreviewIframe({
    schema,
    open,
  });

  const initialSrc = useMemo(
    () => (open ? buildPreviewUrl(schema, settings) : 'about:blank'),
    // Only rebuild on drawer open; subsequent updates flow via postMessage
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );

  const handleReload = (): void => {
    if (!iframeRef.current) return;
    iframeRef.current.src = buildPreviewUrl(schema, settings);
  };

  const frameWidth = previewIframeWidth(settings.device);

  return (
    <Drawer
      title={
        <Space>
          <span>Test</span>
          <span>Preview</span>
          {title ? <Tag color="orange">{title}</Tag> : null}
        </Space>
      }
      open={open}
      width="90%"
      onClose={onClose}
      destroyOnClose
      styles={{ body: { padding: 0 } }}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReload}>
            Reload
          </Button>
          <Button onClick={onClose}>Close</Button>
        </Space>
      }
    >
      <div className="flex flex-col h-full">
        <PreviewToolbar settings={settings} onChange={updateSettings} />
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div
            className="mx-auto bg-white shadow-md rounded-lg overflow-hidden relative"
            style={{ width: frameWidth, maxWidth: '100%' }}
          >
            {!ready ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                <Spin tip="Loading preview..." />
              </div>
            ) : null}
            <iframe
              ref={iframeRef}
              src={initialSrc}
              title="schema-preview"
              className="w-full border-0"
              style={{ height: 'calc(100vh - 200px)' }}
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
};
