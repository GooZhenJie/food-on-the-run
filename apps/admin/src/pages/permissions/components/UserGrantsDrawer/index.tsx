import {
  Alert,
  Button,
  Drawer,
  Empty,
  Input,
  Popconfirm,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { IUserGrant } from '@/services/roles';
import type { IUserGrantsDrawerProps } from './type';
import { useUserGrantsDrawer } from './hooks';
import {
  formatExpiresForDisplay,
  fromDatetimeLocal,
  isExpired,
  toDatetimeLocal,
} from './utils';

const { TextArea } = Input;

export const UserGrantsDrawer = ({
  open,
  user,
  onClose,
  onChanged,
}: IUserGrantsDrawerProps) => {
  const {
    state,
    startCreate,
    startEdit,
    cancelEdit,
    updateForm,
    save,
    remove,
  } = useUserGrantsDrawer(user, open, onChanged);

  const { grants, permissions, editing, form, loading, saving } = state;

  const columns: ColumnsType<IUserGrant> = [
    {
      title: 'Permission',
      dataIndex: 'permission_code',
      key: 'permission_code',
      render: (code: string) => <code className="text-xs">{code}</code>,
    },
    {
      title: 'Effect',
      dataIndex: 'effect',
      key: 'effect',
      width: 90,
      render: (e: IUserGrant['effect']) =>
        e === 'deny' ? (
          <Tag color="red">deny</Tag>
        ) : (
          <Tag color="green">allow</Tag>
        ),
    },
    {
      title: 'Scope',
      dataIndex: 'scope',
      key: 'scope',
      width: 160,
      render: (scope: IUserGrant['scope']) => {
        if (!scope || !scope.restaurant_ids?.length) {
          return <span className="text-xs text-gray-400">global</span>;
        }
        return (
          <span className="text-xs">
            rids: [{scope.restaurant_ids.join(', ')}]
          </span>
        );
      },
    },
    {
      title: 'Expires',
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 180,
      render: (s?: string | null) => {
        if (!s) {
          return <span className="text-xs text-gray-400">never</span>;
        }
        const expired = isExpired(s);
        return (
          <span
            className={`text-xs ${expired ? 'text-gray-400' : 'text-gray-700'}`}
          >
            {formatExpiresForDisplay(s)}
            {expired ? ' (expired)' : ''}
          </span>
        );
      },
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (r?: string) =>
        r ? (
          <span className="text-xs text-gray-600">{r}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'right',
      fixed: 'right',
      render: (_, row) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => startEdit(row)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete override?"
            onConfirm={() => remove(row)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const permissionOptions = permissions.map((p) => ({
    value: p.id,
    label: p.code,
  }));

  const isEditing = Boolean(editing) || form.permissionId !== null;

  return (
    <Drawer
      title={
        user ? (
          <span>
            Permission overrides —{' '}
            <span className="text-gray-500">{user.name}</span>
          </span>
        ) : (
          'Permission overrides'
        )
      }
      width="min(720px, 100vw)"
      open={open}
      onClose={onClose}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={startCreate}
          disabled={loading}
        >
          Add override
        </Button>
      }
    >
      {loading ? (
        <div className="py-12 flex justify-center">
          <Spin />
        </div>
      ) : (
        <>
          <Alert
            className="mb-4"
            type="warning"
            showIcon
            message="Overrides take effect on the user's next token refresh (up to 1 hour). DENY beats ALLOW beats role."
          />

          {grants.length === 0 ? (
            <Empty
              className="mb-6"
              description="No overrides yet. Use overrides sparingly — prefer editing roles."
            />
          ) : (
            <Table<IUserGrant>
              rowKey={(row) => `${row.user_id}-${row.permission_id}`}
              columns={columns}
              dataSource={grants}
              pagination={false}
              size="small"
              className="mb-6"
              scroll={{ x: 'max-content' }}
            />
          )}

          {isEditing ? (
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <div className="text-sm font-medium text-gray-900 mb-3">
                {editing ? 'Edit override' : 'New override'}
              </div>

              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Permission</div>
                <Select
                  style={{ width: '100%' }}
                  value={form.permissionId ?? undefined}
                  onChange={(v) => updateForm({ permissionId: v })}
                  options={permissionOptions}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  disabled={Boolean(editing)}
                  placeholder="Pick a permission code"
                />
                {editing ? (
                  <div className="text-xs text-gray-500 mt-1">
                    Permission is immutable on edit. Delete and recreate to
                    change.
                  </div>
                ) : null}
              </div>

              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">Effect</div>
                <Radio.Group
                  value={form.effect}
                  onChange={(e) => updateForm({ effect: e.target.value })}
                >
                  <Radio.Button value="allow">Allow (add)</Radio.Button>
                  <Radio.Button value="deny">Deny (remove)</Radio.Button>
                </Radio.Group>
              </div>

              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">
                  Scope restriction
                </div>
                <Space>
                  <Switch
                    checked={form.scopeEnabled}
                    onChange={(checked) =>
                      updateForm({ scopeEnabled: checked })
                    }
                  />
                  <span className="text-xs text-gray-500">
                    {form.scopeEnabled
                      ? 'Limit override to these restaurants'
                      : 'Global (applies to all resources)'}
                  </span>
                </Space>
                {form.scopeEnabled ? (
                  <div className="mt-2">
                    <Input
                      placeholder="Restaurant IDs, comma separated e.g. 101,102"
                      value={form.restaurantIdsInput}
                      onChange={(e) =>
                        updateForm({ restaurantIdsInput: e.target.value })
                      }
                    />
                  </div>
                ) : null}
              </div>

              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">
                  Expires (optional, local time)
                </div>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  value={toDatetimeLocal(form.expiresAt)}
                  onChange={(e) =>
                    updateForm({ expiresAt: fromDatetimeLocal(e.target.value) })
                  }
                />
              </div>

              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">
                  Reason (required — written to audit log)
                </div>
                <TextArea
                  rows={2}
                  value={form.reason}
                  onChange={(e) => updateForm({ reason: e.target.value })}
                  placeholder="Why is this override needed?"
                />
              </div>

              <Space>
                <Button type="primary" loading={saving} onClick={save}>
                  {editing ? 'Save' : 'Create'}
                </Button>
                <Button onClick={cancelEdit}>Cancel</Button>
              </Space>
            </div>
          ) : null}
        </>
      )}
    </Drawer>
  );
};
