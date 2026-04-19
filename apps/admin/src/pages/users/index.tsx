import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface UserRow {
  id: string;
  email: string;
  role: 'consumer' | 'restaurant' | 'rider' | 'admin' | 'support';
  status: 'active' | 'banned';
  createdAt: string;
}

const PLACEHOLDER_ROWS: UserRow[] = [];

const ROLE_COLORS: Record<UserRow['role'], string> = {
  consumer: 'default',
  restaurant: 'orange',
  rider: 'blue',
  admin: 'purple',
  support: 'cyan',
};

export default function UsersPage() {
  const columns: ColumnsType<UserRow> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 140 },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: UserRow['role']) => <Tag color={ROLE_COLORS[role]}>{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: UserRow['status']) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Users</h1>
        <p className="text-sm text-gray-500">
          Manage accounts, roles, and bans across the platform.
        </p>
      </div>
      <Table<UserRow>
        rowKey="id"
        columns={columns}
        dataSource={PLACEHOLDER_ROWS}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
