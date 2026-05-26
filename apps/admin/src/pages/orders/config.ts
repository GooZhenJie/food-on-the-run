import type { OrderStatus, PaymentMethod } from '@/services/orders';

export const DEFAULT_PAGE_SIZE = 20;

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  created: 'default',
  preparing: 'processing',
  delivering: 'blue',
  completed: 'green',
  cancelled: 'red',
  refunded: 'volcano',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  created: 'Created',
  preparing: 'Preparing',
  delivering: 'Delivering',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'created', label: 'Created' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'delivering', label: 'Delivering' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export const ORDER_STATUS_TRANSITIONS: OrderStatus[] = [
  'created',
  'preparing',
  'delivering',
  'completed',
  'cancelled',
];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: 'Card',
  wallet: 'Wallet',
  cash: 'Cash',
  paynow: 'PayNow',
};

export const PAYMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All methods' },
  { value: 'card', label: 'Card' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'paynow', label: 'PayNow' },
  { value: 'cash', label: 'Cash' },
];
