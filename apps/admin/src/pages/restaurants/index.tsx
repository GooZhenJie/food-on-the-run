import { useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Rate,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  EyeOutlined,
  MoreOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { Key } from 'react';
import type {
  AdminRestaurant,
  RestaurantStatus,
  RestaurantUpsertBody,
} from '@/services/restaurants';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { useRestaurants } from './hooks';
import {
  CITY_OPTIONS,
  CUISINE_OPTIONS,
  STATUS_COLORS,
  STATUS_FILTER_OPTIONS,
  STATUS_LABELS,
} from './config';
import { RestaurantFormDrawer } from './components/RestaurantFormDrawer';
import { RestaurantDetailDrawer } from './components/RestaurantDetailDrawer';

const { Search } = Input;

export default function RestaurantsPage() {
  const {
    state,
    query,
    setPage,
    setKeyword,
    setStatus,
    setCuisine,
    setCity,
    setSort,
    refresh,
    create,
    update,
    remove,
    bulkRemove,
    updateStatus,
    exportCsv,
  } = useRestaurants();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminRestaurant | null>(null);
  const [detailRecord, setDetailRecord] = useState<AdminRestaurant | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);

  const openCreate = (): void => {
    setFormMode('create');
    setEditingRecord(null);
    setFormOpen(true);
  };

  const openEdit = (record: AdminRestaurant): void => {
    setFormMode('edit');
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleSubmit = async (body: RestaurantUpsertBody): Promise<void> => {
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

  const confirmDelete = (record: AdminRestaurant): void => {
    Modal.confirm({
      title: `Delete ${record.name}?`,
      icon: <ExclamationCircleFilled />,
      content: 'This will permanently remove the restaurant record.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        await remove(record.id);
      },
    });
  };

  const confirmBulkDelete = (): void => {
    if (selectedKeys.length === 0) return;
    Modal.confirm({
      title: `Delete ${selectedKeys.length} restaurants?`,
      icon: <ExclamationCircleFilled />,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        await bulkRemove(selectedKeys.map(String));
        setSelectedKeys([]);
      },
    });
  };

  const handleStatusMenuClick = async (
    record: AdminRestaurant,
    next: RestaurantStatus,
  ): Promise<void> => {
    if (record.status === next) return;
    await updateStatus(record.id, next);
  };

  const columns: ColumnsType<AdminRestaurant> = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 110,
        fixed: 'left',
        render: (id: string) => <code className="text-xs">{id}</code>,
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        render: (_: unknown, row: AdminRestaurant) => (
          <div className="leading-tight">
            <div className="text-sm text-gray-900 font-medium">{row.name}</div>
            <div className="text-xs text-gray-500">
              {row.cuisine} · {row.city}
            </div>
          </div>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        sorter: true,
        render: (status: RestaurantStatus) => (
          <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
        ),
      },
      {
        title: 'Owner',
        dataIndex: 'ownerEmail',
        key: 'ownerEmail',
        render: (_: unknown, row: AdminRestaurant) => (
          <div className="leading-tight">
            <div className="text-sm text-gray-900">{row.ownerName}</div>
            <div className="text-xs text-gray-500">{row.ownerEmail}</div>
          </div>
        ),
      },
      {
        title: 'Rating',
        dataIndex: 'rating',
        key: 'rating',
        width: 160,
        sorter: true,
        render: (rating: number) => (
          <div className="flex items-center gap-2">
            <Rate disabled allowHalf value={rating} className="!text-sm" />
            <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
          </div>
        ),
      },
      {
        title: 'Orders today',
        dataIndex: 'ordersToday',
        key: 'ordersToday',
        width: 130,
        align: 'right',
        sorter: true,
      },
      {
        title: 'Revenue MTD',
        dataIndex: 'revenueMonthCents',
        key: 'revenueMonthCents',
        width: 150,
        align: 'right',
        sorter: true,
        render: (cents: number) => formatCurrency(cents),
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        sorter: true,
        render: (t: string) => (
          <span className="text-sm text-gray-500">{formatDateTime(t)}</span>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 220,
        align: 'right',
        fixed: 'right',
        render: (_: unknown, row: AdminRestaurant) => {
          const statusMenu = [
            {
              key: 'active',
              icon: <CheckCircleOutlined />,
              label: 'Set active',
              disabled: row.status === 'active',
            },
            {
              key: 'pending',
              icon: <ReloadOutlined />,
              label: 'Send to review',
              disabled: row.status === 'pending',
            },
            {
              key: 'suspended',
              icon: <PauseCircleOutlined />,
              label: 'Suspend',
              disabled: row.status === 'suspended',
              danger: true,
            },
          ];
          return (
            <Space size={0}>
              <Button
                size="small"
                type="link"
                icon={<EyeOutlined />}
                onClick={() => setDetailRecord(row)}
              >
                View
              </Button>
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
                    ...statusMenu,
                    { type: 'divider' as const },
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: 'Delete',
                      danger: true,
                    },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'delete') {
                      confirmDelete(row);
                    } else {
                      handleStatusMenuClick(row, key as RestaurantStatus);
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
    [],
  );

  const handleTableChange: TableProps<AdminRestaurant>['onChange'] = (
    _pagination,
    _filters,
    sorter,
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s && s.field && s.order) {
      setSort(
        s.field as NonNullable<typeof query.sortField>,
        s.order === 'ascend' ? 'asc' : 'desc',
      );
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            Restaurants
          </h1>
          <p className="text-sm text-gray-500">
            Onboard, review, and moderate restaurant accounts.
          </p>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportCsv}>
            Export CSV
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            Add restaurant
          </Button>
        </Space>
      </div>

      <Space className="mb-4" size="middle" wrap>
        <Search
          placeholder="Search by name, owner, email or ID"
          allowClear
          onSearch={setKeyword}
          defaultValue={query.keyword}
          className="w-full sm:w-[300px]"
        />
        <Select
          value={query.status}
          className="w-full sm:w-[180px]"
          options={STATUS_FILTER_OPTIONS}
          onChange={setStatus}
        />
        <Select
          value={query.cuisine}
          className="w-full sm:w-[180px]"
          options={[
            { value: 'all', label: 'All cuisines' },
            ...CUISINE_OPTIONS.map((c) => ({ value: c, label: c })),
          ]}
          onChange={setCuisine}
        />
        <Select
          value={query.city}
          className="w-full sm:w-[180px]"
          options={[
            { value: 'all', label: 'All cities' },
            ...CITY_OPTIONS.map((c) => ({ value: c, label: c })),
          ]}
          onChange={setCity}
          showSearch
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

      <Table<AdminRestaurant>
        rowKey="id"
        columns={columns}
        dataSource={state.items}
        loading={state.loading}
        scroll={{ x: 'max-content' }}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys),
        }}
        onChange={handleTableChange}
        pagination={{
          current: state.page,
          pageSize: state.pageSize,
          total: state.total,
          showSizeChanger: true,
          showTotal: (total) => `${total} restaurants`,
          onChange: (p, ps) => setPage(p, ps),
        }}
      />

      <RestaurantFormDrawer
        open={formOpen}
        mode={formMode}
        record={editingRecord}
        submitting={formSubmitting}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <RestaurantDetailDrawer
        open={Boolean(detailRecord)}
        record={detailRecord}
        onClose={() => setDetailRecord(null)}
      />
    </div>
  );
}
