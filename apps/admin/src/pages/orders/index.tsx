import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
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
  DollarCircleOutlined,
  DownloadOutlined,
  ExclamationCircleFilled,
  EyeOutlined,
  MoreOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { Key } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { AdminOrder, OrderStatus } from '@/services/orders';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { useOrders } from './hooks';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_FILTER_OPTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_FILTER_OPTIONS,
  PAYMENT_LABELS,
} from './config';
import { OrderDetailDrawer } from './components/OrderDetailDrawer';

const { Search } = Input;
const { RangePicker } = DatePicker;

export default function OrdersPage() {
  const {
    state,
    metrics,
    query,
    setPage,
    setKeyword,
    setStatus,
    setPayment,
    setDateRange,
    setSort,
    refresh,
    changeStatus,
    refund,
    remove,
    bulkChangeStatus,
    exportCsv,
  } = useOrders();

  const [detailRecord, setDetailRecord] = useState<AdminOrder | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);

  const rangeValue = useMemo<[Dayjs | null, Dayjs | null] | undefined>(() => {
    if (!query.from && !query.to) return undefined;
    return [query.from ? dayjs(query.from) : null, query.to ? dayjs(query.to) : null];
  }, [query.from, query.to]);

  const handleChangeStatus = async (
    id: string,
    status: OrderStatus,
  ): Promise<void> => {
    setDetailBusy(true);
    try {
      await changeStatus(id, status);
      setDetailRecord((prev) =>
        prev && prev.id === id ? { ...prev, status } : prev,
      );
    } finally {
      setDetailBusy(false);
    }
  };

  const handleRefund = async (id: string): Promise<void> => {
    setDetailBusy(true);
    try {
      await refund(id);
      setDetailRecord((prev) =>
        prev && prev.id === id ? { ...prev, status: 'refunded' } : prev,
      );
    } finally {
      setDetailBusy(false);
    }
  };

  const confirmDelete = (record: AdminOrder): void => {
    Modal.confirm({
      title: `Remove order ${record.id}?`,
      icon: <ExclamationCircleFilled />,
      content: 'Removing will hide it from the dashboard. Use refund instead if the customer was charged.',
      okText: 'Remove',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      async onOk() {
        await remove(record.id);
      },
    });
  };

  const confirmBulkStatus = (status: OrderStatus): void => {
    if (selectedKeys.length === 0) return;
    Modal.confirm({
      title: `Mark ${selectedKeys.length} order(s) as ${ORDER_STATUS_LABELS[status]}?`,
      icon: <ExclamationCircleFilled />,
      okText: 'Apply',
      cancelText: 'Cancel',
      async onOk() {
        await bulkChangeStatus(selectedKeys.map(String), status);
        setSelectedKeys([]);
      },
    });
  };

  const columns: ColumnsType<AdminOrder> = useMemo(
    () => [
      {
        title: 'Order ID',
        dataIndex: 'id',
        key: 'id',
        width: 130,
        fixed: 'left',
        render: (id: string) => <code className="text-xs">{id}</code>,
      },
      {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
        sorter: true,
        render: (_: unknown, row) => (
          <div className="leading-tight">
            <div className="text-sm text-gray-900 font-medium">{row.customerName}</div>
            <div className="text-xs text-gray-500">{row.customerEmail}</div>
          </div>
        ),
      },
      {
        title: 'Restaurant',
        dataIndex: 'restaurantName',
        key: 'restaurantName',
        sorter: true,
        render: (_: unknown, row) => (
          <div className="leading-tight">
            <div className="text-sm text-gray-900">{row.restaurantName}</div>
            <code className="text-xs text-gray-500">{row.restaurantId}</code>
          </div>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        sorter: true,
        render: (status: OrderStatus) => (
          <Tag color={ORDER_STATUS_COLORS[status]}>
            {ORDER_STATUS_LABELS[status]}
          </Tag>
        ),
      },
      {
        title: 'Items',
        key: 'itemsCount',
        width: 80,
        align: 'right',
        render: (_: unknown, row) => row.items.length,
      },
      {
        title: 'Payment',
        dataIndex: 'paymentMethod',
        key: 'paymentMethod',
        width: 110,
        render: (p: AdminOrder['paymentMethod']) => PAYMENT_LABELS[p],
      },
      {
        title: 'Total',
        dataIndex: 'totalCents',
        key: 'totalCents',
        width: 120,
        align: 'right',
        sorter: true,
        render: (cents: number) => (
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(cents)}
          </span>
        ),
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
        width: 180,
        align: 'right',
        fixed: 'right',
        render: (_: unknown, row) => (
          <Space size={0}>
            <Button
              size="small"
              type="link"
              icon={<EyeOutlined />}
              onClick={() => setDetailRecord(row)}
            >
              View
            </Button>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  ...ORDER_STATUS_TRANSITIONS.filter((s) => s !== row.status).map(
                    (s) => ({
                      key: `status:${s}`,
                      icon: <SyncOutlined />,
                      label: `Mark ${ORDER_STATUS_LABELS[s]}`,
                    }),
                  ),
                  { type: 'divider' as const },
                  {
                    key: 'refund',
                    icon: <DollarCircleOutlined />,
                    label: 'Refund',
                    disabled:
                      row.status === 'refunded' || row.status === 'cancelled',
                  },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: 'Remove',
                    danger: true,
                  },
                ],
                onClick: ({ key }) => {
                  if (key === 'refund') {
                    handleRefund(row.id);
                  } else if (key === 'delete') {
                    confirmDelete(row);
                  } else if (key.startsWith('status:')) {
                    const next = key.slice('status:'.length) as OrderStatus;
                    handleChangeStatus(row.id, next);
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
        ),
      },
    ],
    [],
  );

  const handleTableChange: TableProps<AdminOrder>['onChange'] = (
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
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Orders</h1>
          <p className="text-sm text-gray-500">
            Monitor live orders and intervene when needed.
          </p>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportCsv}
          >
            Export CSV
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Card size="small" loading={metrics.loading}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
              <ShoppingCartOutlined />
            </div>
            <div>
              <div className="text-xs text-gray-500">Orders (filtered)</div>
              <div className="text-lg font-semibold text-gray-900">
                {metrics.totalOrders}
              </div>
            </div>
          </div>
        </Card>
        <Card size="small" loading={metrics.loading}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <DollarCircleOutlined />
            </div>
            <div>
              <div className="text-xs text-gray-500">Gross revenue</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(metrics.grossRevenueCents)}
              </div>
            </div>
          </div>
        </Card>
        <Card size="small" loading={metrics.loading}>
          <div>
            <div className="text-xs text-gray-500 mb-1">In progress</div>
            <div className="text-lg font-semibold text-gray-900">
              {(metrics.byStatus.preparing ?? 0) +
                (metrics.byStatus.delivering ?? 0)}
            </div>
          </div>
        </Card>
        <Card size="small" loading={metrics.loading}>
          <div>
            <div className="text-xs text-gray-500 mb-1">Completed</div>
            <div className="text-lg font-semibold text-gray-900">
              {metrics.byStatus.completed ?? 0}
            </div>
          </div>
        </Card>
      </div>

      <Space className="mb-4" size="middle" wrap>
        <Search
          placeholder="Search by order ID, customer, restaurant"
          allowClear
          onSearch={setKeyword}
          defaultValue={query.keyword}
          className="w-full sm:w-[320px]"
        />
        <Select
          value={query.status}
          className="w-full sm:w-[160px]"
          options={ORDER_STATUS_FILTER_OPTIONS}
          onChange={setStatus}
        />
        <Select
          value={query.payment}
          className="w-full sm:w-[160px]"
          options={PAYMENT_FILTER_OPTIONS}
          onChange={setPayment}
        />
        <RangePicker
          value={rangeValue}
          onChange={(vals) => {
            const from = vals?.[0] ? vals[0].toISOString() : '';
            const to = vals?.[1] ? vals[1].toISOString() : '';
            setDateRange(from, to);
          }}
          className="w-full sm:w-[280px]"
        />
      </Space>

      {selectedKeys.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 px-3 py-2 rounded-md bg-orange-50 border border-orange-100">
          <span className="text-sm text-gray-700">
            {selectedKeys.length} selected
          </span>
          <Select
            size="small"
            placeholder="Bulk change status"
            onChange={(val) => confirmBulkStatus(val as OrderStatus)}
            options={ORDER_STATUS_TRANSITIONS.map((s) => ({
              value: s,
              label: `Mark ${ORDER_STATUS_LABELS[s]}`,
            }))}
            style={{ width: 200 }}
          />
          <Button size="small" type="link" onClick={() => setSelectedKeys([])}>
            Clear selection
          </Button>
        </div>
      ) : null}

      <Table<AdminOrder>
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
          showTotal: (total) => `${total} orders`,
          onChange: (p, ps) => setPage(p, ps),
        }}
      />

      <OrderDetailDrawer
        open={Boolean(detailRecord)}
        record={detailRecord}
        busy={detailBusy}
        onClose={() => setDetailRecord(null)}
        onChangeStatus={handleChangeStatus}
        onRefund={handleRefund}
      />
    </div>
  );
}
