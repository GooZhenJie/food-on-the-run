import { useState } from 'react';
import { Button, Card, Modal, Space, Table, Tag, Tooltip } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { IPermission, IRole } from '@/services/roles';
import { isSuperAdmin } from '@/utils/auth';
import { ROLE_COLORS } from '../../config';
import { useRolesOverview } from './hooks';
import { RoleEditDrawer } from '../RoleEditDrawer';
import { NewRoleModal } from '../NewRoleModal';

export const RolesOverview = () => {
  const { state, createCustomRole, removeRole, saveRoleEdits } =
    useRolesOverview();
  const canEdit = isSuperAdmin();

  const [editing, setEditing] = useState<IRole | null>(null);
  const [creating, setCreating] = useState<boolean>(false);

  const descByCode = new Map<string, string>(
    state.permissions.map((p) => [p.code, p.description ?? '']),
  );

  const confirmDelete = (role: IRole): void => {
    Modal.confirm({
      title: 'Delete custom role?',
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <p className="mb-2">
            Delete <code>{role.code}</code> (<strong>{role.name}</strong>)?
          </p>
          <p className="text-sm text-gray-500 mb-0">
            Only custom roles with zero assignments can be deleted. The
            operation is a soft delete and is logged in <code>audit_logs</code>.
          </p>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        await removeRole(role);
      },
    });
  };

  const rolesColumns: ColumnsType<IRole> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (code: string) => (
        <code className="text-sm font-medium text-gray-900">{code}</code>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: 'Persona',
      dataIndex: 'persona',
      key: 'persona',
      width: 110,
      render: (p: IRole['persona']) => (
        <Tag color={ROLE_COLORS[p]}>{p}</Tag>
      ),
    },
    {
      title: 'Kind',
      dataIndex: 'is_system',
      key: 'is_system',
      width: 90,
      render: (sys: boolean) =>
        sys ? (
          <Tag color="geekblue">system</Tag>
        ) : (
          <Tag color="default">custom</Tag>
        ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permission_codes',
      key: 'permission_codes',
      render: (codes?: string[]) => {
        if (!codes || codes.length === 0) {
          return <span className="text-xs text-gray-400">none</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {codes.map((c) => (
              <Tooltip
                key={c}
                title={descByCode.get(c) || undefined}
                placement="top"
              >
                <Tag className="text-xs">{c}</Tag>
              </Tooltip>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      align: 'right',
      fixed: 'right',
      render: (_, row) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            disabled={!canEdit}
            onClick={() => setEditing(row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            type="link"
            danger
            icon={<DeleteOutlined />}
            disabled={!canEdit || row.is_system}
            onClick={() => confirmDelete(row)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const permissionsColumns: ColumnsType<IPermission> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 220,
      render: (code: string) => <code className="text-sm">{code}</code>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d?: string) => d || <span className="text-gray-400">—</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Roles"
        extra={
          canEdit ? (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setCreating(true)}
            >
              New role
            </Button>
          ) : (
            <span className="text-xs text-gray-500">
              Super admin required to edit
            </span>
          )
        }
      >
        <Table<IRole>
          rowKey="id"
          loading={state.loading}
          columns={rolesColumns}
          dataSource={state.roles}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card title="Permission points">
        <Table<IPermission>
          rowKey="id"
          loading={state.loading}
          columns={permissionsColumns}
          dataSource={state.permissions}
          pagination={{ pageSize: 20 }}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <RoleEditDrawer
        open={Boolean(editing)}
        role={editing}
        allPermissions={state.permissions}
        saving={state.saving}
        onClose={() => setEditing(null)}
        onSave={async (nextName, nextCodes) => {
          if (!editing) return false;
          return saveRoleEdits(editing, nextName, nextCodes);
        }}
      />

      <NewRoleModal
        open={creating}
        saving={state.saving}
        onClose={() => setCreating(false)}
        onSubmit={async (payload) => {
          const role = await createCustomRole(payload);
          if (role) {
            setCreating(false);
            setEditing(role);
          }
        }}
      />
    </div>
  );
};
