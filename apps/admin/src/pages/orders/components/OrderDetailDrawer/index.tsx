import { useMemo } from 'react';
import { Button, Descriptions, Divider, Drawer, Select, Space, Tag } from 'antd';
import type { AdminOrder, OrderStatus } from '@/services/orders';
import { formatCurrency, formatDateTime } from '@/utils/format';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_LABELS,
} from '../../config';

interface IOrderDetailDrawerProps {
  open: boolean;
  record: AdminOrder | null;
  busy: boolean;
  onClose: () => void;
  onChangeStatus: (id: string, status: OrderStatus) => Promise<void>;
  onRefund: (id: string) => Promise<void>;
}

export const OrderDetailDrawer: React.FC<IOrderDetailDrawerProps> = ({
  open,
  record,
  busy,
  onClose,
  onChangeStatus,
  onRefund,
}) => {
  const statusOptions = useMemo(
    () =>
      ORDER_STATUS_TRANSITIONS.map((s) => ({
        value: s,
        label: ORDER_STATUS_LABELS[s],
      })),
    [],
  );

  return (
    <Drawer
      title={record ? `Order ${record.id}` : 'Order'}
      width="min(720px, 100vw)"
      open={open}
      onClose={onClose}
      extra={
        record ? (
          <Space>
            <Select
              size="small"
              value={record.status}
              options={statusOptions}
              disabled={busy || record.status === 'refunded'}
              onChange={(next) => onChangeStatus(record.id, next)}
              style={{ width: 150 }}
            />
            <Button
              danger
              size="small"
              loading={busy}
              disabled={record.status === 'refunded' || record.status === 'cancelled'}
              onClick={() => onRefund(record.id)}
            >
              Refund
            </Button>
          </Space>
        ) : null
      }
    >
      {record ? (
        <div>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Status">
              <Tag color={ORDER_STATUS_COLORS[record.status]}>
                {ORDER_STATUS_LABELS[record.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {formatDateTime(record.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated">
              {formatDateTime(record.updatedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Customer">
              <div className="leading-tight">
                <div className="text-sm text-gray-900">{record.customerName}</div>
                <div className="text-xs text-gray-500">{record.customerEmail}</div>
                <div className="text-xs text-gray-500">{record.customerPhone}</div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Delivery address">
              {record.deliveryAddress || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Restaurant">
              <div className="leading-tight">
                <div className="text-sm text-gray-900">{record.restaurantName}</div>
                <code className="text-xs text-gray-500">{record.restaurantId}</code>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Rider">
              {record.riderName ?? <span className="text-gray-400">Unassigned</span>}
            </Descriptions.Item>
            <Descriptions.Item label="Payment method">
              {PAYMENT_LABELS[record.paymentMethod]}
            </Descriptions.Item>
            <Descriptions.Item label="Note">{record.note || '-'}</Descriptions.Item>
          </Descriptions>

          <Divider titlePlacement="start" className="!mt-6 !mb-3">
            Items
          </Divider>
          <div className="space-y-2">
            {record.items.map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                className="flex items-center justify-between text-sm text-gray-700"
              >
                <div>
                  <span className="text-gray-500 mr-2">× {item.quantity}</span>
                  {item.name}
                </div>
                <span className="text-gray-900">
                  {formatCurrency(item.priceCents * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Divider className="!my-4" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(record.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery fee</span>
              <span>{formatCurrency(record.deliveryFeeCents)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-1">
              <span>Total</span>
              <span>{formatCurrency(record.totalCents)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
};
