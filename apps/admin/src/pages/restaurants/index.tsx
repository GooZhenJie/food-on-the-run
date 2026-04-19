import { Button, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface RestaurantRow {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'suspended';
  ownerEmail: string;
  createdAt: string;
}

const PLACEHOLDER_ROWS: RestaurantRow[] = [];

const STATUS_COLORS: Record<RestaurantRow['status'], string> = {
  active: 'green',
  pending: 'gold',
  suspended: 'red',
};

export default function RestaurantsPage() {
  const columns: ColumnsType<RestaurantRow> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: RestaurantRow['status']) => (
        <Tag color={STATUS_COLORS[status]}>{status}</Tag>
      ),
    },
    { title: 'Owner', dataIndex: 'ownerEmail', key: 'ownerEmail' },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Restaurants</h1>
          <p className="text-sm text-gray-500">
            Onboard, review, and moderate restaurant accounts.
          </p>
        </div>
        <Button type="primary">Add restaurant</Button>
      </div>
      <Table<RestaurantRow>
        rowKey="id"
        columns={columns}
        dataSource={PLACEHOLDER_ROWS}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
