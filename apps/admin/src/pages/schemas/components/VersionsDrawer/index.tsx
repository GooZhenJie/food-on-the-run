import React, { useEffect, useState } from 'react';
import { Button, Drawer, Empty, Spin, Tag, Tooltip, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { PageSchemaVersion } from '@/services/schemas';
import { listPageSchemaVersions } from '@/services/schemas';
import type { IVersionsDrawerProps } from './type';

const { Paragraph, Text } = Typography;

export const VersionsDrawer: React.FC<IVersionsDrawerProps> = ({
  open,
  schemaKey,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<PageSchemaVersion[]>([]);
  const [copyingId, setCopyingId] = useState<number | null>(null);

  const handleCopy = async (v: PageSchemaVersion): Promise<void> => {
    setCopyingId(v.id);
    const text = JSON.stringify(v.schema_data, null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      message.success(`v${v.version} config copied`);
    } catch {
      message.error('Failed to copy');
    } finally {
      setCopyingId(null);
    }
  };

  useEffect(() => {
    if (!open || !schemaKey) return;
    setLoading(true);
    listPageSchemaVersions(schemaKey)
      .then((res) => setVersions(res.items))
      .catch((err) =>
        message.error(err instanceof Error ? err.message : 'Load failed'),
      )
      .finally(() => setLoading(false));
  }, [open, schemaKey]);

  return (
    <Drawer
      title={schemaKey ? `History · ${schemaKey}` : 'History'}
      open={open}
      width="min(720px, 100vw)"
      onClose={onClose}
      destroyOnClose
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spin />
        </div>
      ) : versions.length === 0 ? (
        <Empty description="No versions" />
      ) : (
        <div className="space-y-4">
          {versions.map((v) => (
            <div
              key={v.id}
              className="border border-gray-200 rounded-md p-4 bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Tag color="orange">v{v.version}</Tag>
                  <Text type="secondary" className="text-xs">
                    {new Date(v.created_at).toLocaleString()}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    by #{v.creator_id}
                  </Text>
                </div>
                <Tooltip title="Copy config">
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    loading={copyingId === v.id}
                    onClick={() => handleCopy(v)}
                  />
                </Tooltip>
              </div>
              {v.note && (
                <Paragraph className="!mb-2 text-sm text-gray-700">
                  {v.note}
                </Paragraph>
              )}
              <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto m-0 font-mono">
                {JSON.stringify(v.schema_data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
};
