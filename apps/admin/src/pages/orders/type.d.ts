import type {
  AdminOrder,
  ListOrdersParams,
  OrderStatus,
  PaymentMethod,
} from '@/services/orders';

export type OrderStatusFilter = OrderStatus | 'all';
export type PaymentFilter = PaymentMethod | 'all';

export interface OrdersListState {
  items: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
}

export type OrdersQuery = Required<
  Pick<ListOrdersParams, 'page' | 'pageSize' | 'sortField' | 'sortOrder'>
> & {
  keyword: string;
  status: OrderStatusFilter;
  payment: PaymentFilter;
  from: string;
  to: string;
};

export interface OrdersMetricsState {
  totalOrders: number;
  grossRevenueCents: number;
  byStatus: Record<string, number>;
  loading: boolean;
}
