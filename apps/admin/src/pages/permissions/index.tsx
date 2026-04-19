import { useMemo } from 'react';
import {
  Alert,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TAdminRole } from '@/services/type';
import type { AdminUser } from '@/services/users';
import { getCurrentUser } from '@/utils/auth';
import { useAdminUsers } from './hooks';
import {
  ROLE_COLORS,
  ROLE_DESCRIPTIONS,
  ROLE_FILTER_OPTIONS,
  ROLE_LABELS,
  SELECTABLE_ROLES,
} from './config';

const { Search } = Input;

export default function PermissionsPage() {
  const { state, query, setPage, setRole, setKeyword, updateRole } =
    useAdminUsers();
  const currentUser = useMemo(() => getCurrentUser(), []);

  const columns: ColumnsType<AdminUser> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
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
      title: 'Current role',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: TAdminRole) => (
        <Tag color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 200,
      render: (t: string) => (
        <span className="text-sm text-gray-500">
          {new Date(t).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Change role',
      key: 'actions',
      width: 220,
      align: 'right',
      render: (_, row) => {
        const isSelf = currentUser?.id === row.id;
        return (
          <Select<TAdminRole>
            size="small"
            value={row.role}
            style={{ width: 160 }}
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
  ];

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
            from <Tag color={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Tag>{' '}
            to <Tag color={ROLE_COLORS[nextRole]}>{ROLE_LABELS[nextRole]}</Tag>?
          </p>
          <p className="text-sm text-gray-500 mb-0">
            The user will need to sign in again for the change to take effect on
            their access token.
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Permissions
        </h1>
        <p className="text-sm text-gray-500">
          Assign persona-level roles to each user. Determines which app a user
          can sign into and which API surface they can access.
        </p>
      </div>

      <Alert
        className="mb-5"
        type="info"
        showIcon
        message="Phase 1: persona-level role management"
        description={
          <div className="text-sm">
            <p className="mb-2">
              Fine-grained role/permission management (admin.ops, admin.cs,
              merchant.owner, etc.) ships in Phase 2. Today you can only change
              the top-level persona stored on each user.
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

      <Space className="mb-4" size="middle">
        <Search
          placeholder="Search by name or email"
          allowClear
          onSearch={setKeyword}
          style={{ width: 280 }}
          defaultValue={query.keyword}
        />
        <Select
          value={query.role}
          style={{ width: 180 }}
          options={ROLE_FILTER_OPTIONS}
          onChange={setRole}
        />
      </Space>

      <Table<AdminUser>
        rowKey="id"
        columns={columns}
        dataSource={state.items}
        loading={state.loading}
        pagination={{
          current: state.page,
          pageSize: state.pageSize,
          total: state.total,
          showSizeChanger: true,
          showTotal: (total) => `${total} users`,
          onChange: (page, pageSize) => setPage(page, pageSize),
        }}
      />
    </div>
  );
}
