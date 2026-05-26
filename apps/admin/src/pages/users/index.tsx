import { useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { Key } from 'react';
import type { TAdminRole } from '@/services/type';
import type { AdminUser, AdminUserUpsertBody } from '@/services/users';
import { getCurrentUser, isSuperAdmin } from '@/utils/auth';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { useUsers } from './hooks';
import {
  ROLE_COLORS,
  ROLE_FILTER_OPTIONS,
  ROLE_LABELS,
  ROLE_SELECT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './config';
import { UserFormDrawer } from './components/UserFormDrawer';

const { Search } = Input;

export default function UsersPage() {
  const {
    state,
    query,
    setPage,
    setKeyword,
    setRole,
    setStatus,
    setSort,
    refresh,
    create,
    update,
    remove,
    bulkRemove,
    ban,
    unban,
    changeRole,
    exportCsv,
  } = useUsers();

  const currentUser = useMemo(() => getCurrentUser(), []);
  const canEditRoles = useMemo(() => isSuperAdmin(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminUser | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);

  const openCreate = (): void => {
    setFormMode('create');
    setEditingRecord(null);
    setFormOpen(true);
  };

  const openEdit = (record: AdminUser): void => {
    setFormMode('edit');
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleSubmit = async (body: AdminUserUpsertBody): Promise<void> => {
    setFormSubmitting(true);
    try {
      if (formMode === 'create') {
        await create(body);
      } else if (editingRecord) {
        await update(editingRecord.id, body);
      }
      setFormOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      Modal.error({ title: 'Save failed', content: msg });
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = (record: AdminUser): void => {
    Modal.confirm({
      title: `Delete ${record.name}?`,
      icon: <ExclamationCircleFilled />,
      content: 'Permanently removes the user and their access.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        await remove(record.id);
      },
    });
  };

  const confirmBan = (record: AdminUser): void => {
    Modal.confirm({
      title: `Ban ${record.name}?`,
      icon: <ExclamationCircleFilled />,
      content: 'The user will be unable to sign in until reinstated.',
      okText: 'Ban',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        await ban(record.id);
      },
    });
  };

  const confirmBulkDelete = (): void => {
    if (selectedKeys.length === 0) return;
    Modal.confirm({
      title: `Delete ${selectedKeys.length} user(s)?`,
      icon: <ExclamationCircleFilled />,
      content: 'This cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        await bulkRemove(selectedKeys.map(String));
        setSelectedKeys([]);
      },
    });
  };

  const handleRoleChange = (record: AdminUser, nextRole: TAdminRole): void => {
    if (record.role === nextRole) return;
    Modal.confirm({
      title: 'Change role?',
      icon: <ExclamationCircleFilled />,
      content: (
        <div>
          Change{' '}
          <strong>
            {record.name} ({record.email})
          </strong>{' '}
          from <Tag color={ROLE_COLORS[record.role]}>{ROLE_LABELS[record.role]}</Tag>
          {' '}to <Tag color={ROLE_COLORS[nextRole]}>{ROLE_LABELS[nextRole]}</Tag>?
        </div>
      ),
      okText: 'Confirm',
      cancelText: 'Cancel',
      async onOk() {
        await changeRole(record.id, nextRole);
      },
    });
  };

  const columns: ColumnsType<AdminUser> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 80,
        fixed: 'left',
        render: (id: string) => <code className="text-xs">{id}</code>,
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        render: (_: unknown, row) => (
          <div className="leading-tight">
            <div className="text-sm text-gray-900 font-medium">{row.name}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        ),
      },
      {
        title: 'Phone',
        dataIndex: 'phone',
        key: 'phone',
        width: 160,
        render: (phone?: string) => phone || '-',
      },
      {
        title: 'Role',
        dataIndex: 'role',
        key: 'role',
        width: 160,
        render: (role: TAdminRole, row) => {
          const isSelf = currentUser?.id === row.id;
          return (
            <Select<TAdminRole>
              size="small"
              value={role}
              style={{ width: 130 }}
              disabled={!canEditRoles || (isSelf && role === 'admin')}
              options={ROLE_SELECT_OPTIONS.map((opt) => ({
                ...opt,
                disabled: isSelf && opt.value !== 'admin',
              }))}
              onChange={(next) => handleRoleChange(row, next)}
            />
          );
        },
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status?: string) => (
          <Tag color={status === 'banned' ? 'red' : 'green'}>
            {status === 'banned' ? 'Banned' : 'Active'}
          </Tag>
        ),
      },
      {
        title: 'Orders',
        dataIndex: 'orders_count',
        key: 'orders_count',
        width: 90,
        align: 'right',
        sorter: true,
        render: (n?: number) => n ?? 0,
      },
      {
        title: 'Lifetime spend',
        dataIndex: 'lifetime_spend_cents',
        key: 'lifetime_spend_cents',
        width: 150,
        align: 'right',
        sorter: true,
        render: (cents?: number) => formatCurrency(cents ?? 0),
      },
      {
        title: 'Last active',
        dataIndex: 'last_active_at',
        key: 'last_active_at',
        width: 180,
        sorter: true,
        render: (t?: string) => (
          <span className="text-sm text-gray-500">
            {t ? formatDateTime(t) : '-'}
          </span>
        ),
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        sorter: true,
        render: (t: string) => (
          <span className="text-sm text-gray-500">{formatDateTime(t)}</span>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 180,
        align: 'right',
        fixed: 'right',
        render: (_: unknown, row) => {
          const isSelf = currentUser?.id === row.id;
          const isBanned = row.status === 'banned';
          return (
            <Space size={0}>
              <Button
                size="small"
                type="link"
                icon={<EditOutlined />}
                onClick={() => openEdit(row)}
              >
                Edit
              </Button>
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    {
                      key: isBanned ? 'unban' : 'ban',
                      icon: isBanned ? <UndoOutlined /> : <StopOutlined />,
                      label: isBanned ? 'Reinstate' : 'Ban user',
                      disabled: isSelf,
                      danger: !isBanned,
                    },
                    { type: 'divider' as const },
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: 'Delete',
                      disabled: isSelf,
                      danger: true,
                    },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'ban') {
                      confirmBan(row);
                    } else if (key === 'unban') {
                      unban(row.id);
                    } else if (key === 'delete') {
                      confirmDelete(row);
                    }
                  },
                }}
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
    ],
    [canEditRoles, currentUser?.id],
  );

  const handleTableChange: TableProps<AdminUser>['onChange'] = (
    _pagination,
    _filters,
    sorter,
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s && s.field && s.order) {
      setSort(
        s.field as NonNullable<typeof query.sort_field>,
        s.order === 'ascend' ? 'asc' : 'desc',
      );
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Users</h1>
          <p className="text-sm text-gray-500">
            Manage accounts, roles, and bans across the platform.
          </p>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportCsv}>
            Export CSV
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add user
          </Button>
        </Space>
      </div>

      <Space className="mb-4" size="middle" wrap>
        <Search
          placeholder="Search by name, email, phone or ID"
          allowClear
          onSearch={setKeyword}
          defaultValue={query.keyword}
          className="w-full sm:w-[300px]"
        />
        <Select
          value={query.role}
          className="w-full sm:w-[180px]"
          options={ROLE_FILTER_OPTIONS}
          onChange={setRole}
        />
        <Select
          value={query.status}
          className="w-full sm:w-[160px]"
          options={STATUS_FILTER_OPTIONS}
          onChange={setStatus}
        />
      </Space>

      {selectedKeys.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 px-3 py-2 rounded-md bg-orange-50 border border-orange-100">
          <span className="text-sm text-gray-700">
            {selectedKeys.length} selected
          </span>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={confirmBulkDelete}
          >
            Delete selected
          </Button>
          <Button size="small" type="link" onClick={() => setSelectedKeys([])}>
            Clear selection
          </Button>
        </div>
      ) : null}

      <Table<AdminUser>
        rowKey="id"
        columns={columns}
        dataSource={state.items}
        loading={state.loading}
        scroll={{ x: 'max-content' }}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys),
          getCheckboxProps: (row) => ({
            disabled: currentUser?.id === row.id,
          }),
        }}
        onChange={handleTableChange}
        pagination={{
          current: state.page,
          pageSize: state.pageSize,
          total: state.total,
          showSizeChanger: true,
          showTotal: (total) => `${total} users`,
          onChange: (p, ps) => setPage(p, ps),
        }}
      />

      <UserFormDrawer
        open={formOpen}
        mode={formMode}
        record={editingRecord}
        submitting={formSubmitting}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
