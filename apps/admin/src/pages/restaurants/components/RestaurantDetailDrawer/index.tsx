import { Descriptions, Drawer, Tag } from 'antd';
import type { AdminRestaurant } from '@/services/restaurants';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { STATUS_COLORS, STATUS_LABELS } from '../../config';

interface IRestaurantDetailDrawerProps {
  open: boolean;
  record: AdminRestaurant | null;
  onClose: () => void;
}

export const RestaurantDetailDrawer: React.FC<IRestaurantDetailDrawerProps> = ({
  open,
  record,
  onClose,
}) => (
  <Drawer
    title={record ? record.name : 'Restaurant'}
    width="min(560px, 100vw)"
    open={open}
    onClose={onClose}
  >
    {record ? (
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="ID">
          <code className="text-xs">{record.id}</code>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={STATUS_COLORS[record.status]}>
            {STATUS_LABELS[record.status]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Cuisine">{record.cuisine}</Descriptions.Item>
        <Descriptions.Item label="City">{record.city}</Descriptions.Item>
        <Descriptions.Item label="Address">
          {record.address || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Owner">
          <div className="leading-tight">
            <div className="text-sm text-gray-900">{record.ownerName}</div>
            <div className="text-xs text-gray-500">{record.ownerEmail}</div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Phone">{record.phone || '-'}</Descriptions.Item>
        <Descriptions.Item label="Rating">{record.rating.toFixed(1)}</Descriptions.Item>
        <Descriptions.Item label="Orders today">
          {record.ordersToday}
        </Descriptions.Item>
        <Descriptions.Item label="Revenue MTD">
          {formatCurrency(record.revenueMonthCents)}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {formatDateTime(record.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Updated">
          {formatDateTime(record.updatedAt)}
        </Descriptions.Item>
      </Descriptions>
    ) : null}
  </Drawer>
);
