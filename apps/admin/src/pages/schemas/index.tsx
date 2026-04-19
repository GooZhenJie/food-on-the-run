import { useCallback, useEffect, useState } from 'react';
import { Button, Dropdown, Modal, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  DeleteOutlined,
  ExclamationCircleFilled,
  EyeOutlined,
  HistoryOutlined,
  MoreOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  deletePageSchema,
  getPageSchema,
  listPageSchemas,
} from '@/services/schemas';
import type { PageSchema } from '@/services/schemas';
import { PublishDrawer } from './components/PublishDrawer';
import { VersionsDrawer } from './components/VersionsDrawer';
import { PreviewDrawer } from './components/PreviewDrawer';

export default function SchemasPage() {
  const [rows, setRows] = useState<PageSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishInitialKey, setPublishInitialKey] = useState<string | undefined>(
    undefined,
  );
  const [versionsKey, setVersionsKey] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewSchema, setPreviewSchema] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPageSchemas();
      setRows(res.items);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePublishNew = (): void => {
    setPublishInitialKey(undefined);
    setPublishOpen(true);
  };

  const handlePublishForKey = (key: string): void => {
    setPublishInitialKey(key);
    setPublishOpen(true);
  };

  const handlePreviewForKey = async (key: string): Promise<void> => {
    try {
      const schema = await getPageSchema(key);
      setPreviewKey(key);
      setPreviewSchema(schema.schema_data);
      setPreviewOpen(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Load preview failed');
    }
  };

  const handleDeleteForKey = (key: string): void => {
    Modal.confirm({
      title: 'Delete this schema?',
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <p className="mb-2">
            Route <code className="text-sm">{key}</code> will be removed from
            the public site.
          </p>
          <p className="text-sm text-gray-500 mb-0">
            This action cannot be undone from the console.
          </p>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        try {
          await deletePageSchema(key);
          message.success(`Schema ${key} deleted`);
          refresh();
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Delete failed');
          throw err;
        }
      },
    });
  };

  const columns: ColumnsType<PageSchema> = [
    {
      title: 'Route key',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => <code className="text-sm">{key}</code>,
    },
    {
      title: 'Version',
      dataIndex: 'current_version',
      key: 'current_version',
      width: 120,
      render: (v: number) => <Tag color="orange">v{v}</Tag>,
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 240,
      render: (t: string, row) => {
        const updater = row.last_updated_by;
        const label = updater?.name?.trim() || updater?.email?.trim();
        return (
          <div className="leading-tight">
            <div className="text-sm text-gray-900">
              {new Date(t).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {label ? `by ${label}` : '—'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      align: 'right',
      render: (_, row) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'preview',
            icon: <EyeOutlined />,
            label: 'Preview',
            onClick: () => handlePreviewForKey(row.key),
          },
          {
            key: 'history',
            icon: <HistoryOutlined />,
            label: 'View history',
            onClick: () => setVersionsKey(row.key),
          },
          { type: 'divider' },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteForKey(row.key),
          },
        ];

        return (
          <Space size="small">
            <Button
              size="small"
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => handlePublishForKey(row.key)}
            >
              Publish
            </Button>
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                size="small"
                type="text"
                icon={<MoreOutlined />}
                aria-label="More actions"
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            Page Schemas
          </h1>
          <p className="text-sm text-gray-500">
            Upload and version the config that drives each public page.
          </p>
        </div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={handlePublishNew}
        >
          Publish new schema
        </Button>
      </div>
      <Table<PageSchema>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
      <PublishDrawer
        open={publishOpen}
        initialKey={publishInitialKey}
        onClose={() => setPublishOpen(false)}
        onPublished={() => {
          setPublishOpen(false);
          refresh();
        }}
      />
      <VersionsDrawer
        open={Boolean(versionsKey)}
        schemaKey={versionsKey}
        onClose={() => setVersionsKey(null)}
      />
      <PreviewDrawer
        open={previewOpen}
        title={previewKey ?? undefined}
        schema={previewSchema}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
