import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd';
import {
  ExclamationCircleFilled,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TAdminRole } from '@/services/type';
import type { AdminUser } from '@/services/users';
import { getCurrentUser, isSuperAdmin } from '@/utils/auth';
import { useAdminUsers } from './hooks';
import {
  ROLE_COLORS,
  ROLE_DESCRIPTIONS,
  ROLE_FILTER_OPTIONS,
  ROLE_LABELS,
  SELECTABLE_ROLES,
} from './config';
import { RolesDrawer } from './components/RolesDrawer';
import { RolesOverview } from './components/RolesOverview';
import { UserGrantsDrawer } from './components/UserGrantsDrawer';

const { Search } = Input;

export default function PermissionsPage() {
  const { state, query, setPage, setRole, setKeyword, updateRole, refresh } =
    useAdminUsers();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const canEditRoles = useMemo(() => isSuperAdmin(), []);
  const [drawerUser, setDrawerUser] = useState<AdminUser | null>(null);
  const [grantsUser, setGrantsUser] = useState<AdminUser | null>(null);

  const handleSelectRole = (user: AdminUser, nextRole: TAdminRole): void => {
    Modal.confirm({
      title: 'Change persona role?',
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          <p className="mb-2">
            Change{' '}
            <strong>
              {user.name} <span className="text-gray-500">({user.email})</span>
            </strong>{' '}
            from{' '}
            <Tag color={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Tag>{' '}
            to <Tag color={ROLE_COLORS[nextRole]}>{ROLE_LABELS[nextRole]}</Tag>?
          </p>
          <p className="text-sm text-gray-500 mb-0">
            The user will need to sign in again for the change to take effect on
            their access token. All current RBAC roles will be reset to the new
            persona default.
          </p>
        </div>
      ),
      okText: 'Confirm',
      cancelText: 'Cancel',
      async onOk() {
        await updateRole(user, nextRole);
      },
    });
  };

  const columns: ColumnsType<AdminUser> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: string) => <code className="text-xs">{id}</code>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, row) => (
        <div className="leading-tight">
          <div className="text-sm text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      title: 'Persona',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: TAdminRole) => (
        <Tag color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (t: string) => (
        <span className="text-sm text-gray-500">
          {new Date(t).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Change persona',
      key: 'persona-actions',
      width: 180,
      render: (_, row) => {
        const isSelf = currentUser?.id === row.id;
        return (
          <Select<TAdminRole>
            size="small"
            value={row.role}
            style={{ width: 150 }}
            disabled={isSelf && row.role === 'admin'}
            options={SELECTABLE_ROLES.map((role) => ({
              value: role,
              label: ROLE_LABELS[role],
              disabled: isSelf && role !== 'admin',
            }))}
            dropdownRender={(menu) => (
              <div>
                {menu}
                {isSelf ? (
                  <div className="px-3 py-2 text-xs text-gray-500 border-t">
                    You cannot demote yourself.
                  </div>
                ) : null}
              </div>
            )}
            onChange={(nextRole) => {
              if (nextRole === row.role) return;
              handleSelectRole(row, nextRole);
            }}
          />
        );
      },
    },
    {
      title: 'RBAC',
      key: 'rbac-actions',
      width: 220,
      align: 'right',
      fixed: 'right',
      render: (_, row) => (
        <Space size={0}>
          <Button
            size="small"
            type="link"
            disabled={!canEditRoles}
            onClick={() => setDrawerUser(row)}
          >
            Edit roles
          </Button>
          <Button
            size="small"
            type="link"
            disabled={!canEditRoles}
            onClick={() => setGrantsUser(row)}
          >
            Overrides
          </Button>
        </Space>
      ),
    },
  ];

  const usersTabContent = (
    <>
      <Alert
        className="mb-5"
        type="info"
        showIcon
        message="Two layers of control"
        description={
          <div className="text-sm">
            <p className="mb-2">
              <strong>Persona</strong> (column &ldquo;Change persona&rdquo;)
              gates which app a user can sign into. Changing it resets their
              RBAC assignments to the persona default.
            </p>
            <p className="mb-2">
              <strong>RBAC roles</strong> (button &ldquo;Edit roles&rdquo;)
              assign fine-grained roles and permissions within the same
              persona. Only super admins can edit these.
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-gray-600">
              {SELECTABLE_ROLES.map((role) => (
                <li key={role}>
                  <Tag color={ROLE_COLORS[role]} className="mr-2">
                    {ROLE_LABELS[role]}
                  </Tag>
                  <span className="text-gray-500">
                    {ROLE_DESCRIPTIONS[role]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Space className="mb-4" size="middle" wrap>
        <Search
          placeholder="Search by name or email"
          allowClear
          onSearch={setKeyword}
          className="w-full sm:w-[280px]"
          defaultValue={query.keyword}
        />
        <Select
          value={query.role}
          className="w-full sm:w-[180px]"
          options={ROLE_FILTER_OPTIONS}
          onChange={setRole}
        />
      </Space>

      <Table<AdminUser>
        rowKey="id"
        columns={columns}
        dataSource={state.items}
        loading={state.loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: state.page,
          pageSize: state.pageSize,
          total: state.total,
          showSizeChanger: true,
          showTotal: (total) => `${total} users`,
          onChange: (page, pageSize) => setPage(page, pageSize),
        }}
      />

      <RolesDrawer
        open={Boolean(drawerUser)}
        user={drawerUser}
        onClose={() => setDrawerUser(null)}
        onSaved={() => {
          setDrawerUser(null);
          refresh();
        }}
      />

      <UserGrantsDrawer
        open={Boolean(grantsUser)}
        user={grantsUser}
        onClose={() => setGrantsUser(null)}
      />
    </>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Permissions
        </h1>
        <p className="text-sm text-gray-500">
          Manage personas (who signs into which app) and RBAC roles (what each
          user can do).
        </p>
      </div>

      <Tabs
        defaultActiveKey="users"
        items={[
          {
            key: 'users',
            label: (
              <span>
                <TeamOutlined /> Users
              </span>
            ),
            children: usersTabContent,
          },
          {
            key: 'roles',
            label: (
              <span>
                <SafetyCertificateOutlined /> System roles
              </span>
            ),
            children: <RolesOverview />,
          },
        ]}
      />
    </div>
  );
}
