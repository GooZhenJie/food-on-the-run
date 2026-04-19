import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface OrderRow {
  id: string;
  restaurantName: string;
  status: 'created' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
  totalCents: number;
  createdAt: string;
}

const PLACEHOLDER_ROWS: OrderRow[] = [];

const STATUS_COLORS: Record<OrderRow['status'], string> = {
  created: 'default',
  preparing: 'processing',
  delivering: 'blue',
  completed: 'green',
  cancelled: 'red',
};

export default function OrdersPage() {
  const columns: ColumnsType<OrderRow> = [
    { title: 'Order ID', dataIndex: 'id', key: 'id', width: 140 },
    { title: 'Restaurant', dataIndex: 'restaurantName', key: 'restaurantName' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: OrderRow['status']) => (
        <Tag color={STATUS_COLORS[status]}>{status}</Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalCents',
      key: 'totalCents',
      width: 120,
      render: (cents: number) => `$${(cents / 100).toFixed(2)}`,
    },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Orders</h1>
        <p className="text-sm text-gray-500">
          Monitor live orders and intervene when needed.
        </p>
      </div>
      <Table<OrderRow>
        rowKey="id"
        columns={columns}
        dataSource={PLACEHOLDER_ROWS}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
