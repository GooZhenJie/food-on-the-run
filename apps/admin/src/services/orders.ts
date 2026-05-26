import { adminRequest } from './request';

export type OrderStatus =
  | 'created'
  | 'preparing'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'card' | 'wallet' | 'cash' | 'paynow';

export interface AdminOrderItem {
  name: string;
  quantity: number;
  priceCents: number;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  riderName: string | null;
  status: OrderStatus;
  items: AdminOrderItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListOrdersParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: OrderStatus | 'all';
  payment?: PaymentMethod | 'all';
  from?: string;
  to?: string;
  restaurantId?: string;
  sortField?:
    | 'totalCents'
    | 'customerName'
    | 'restaurantName'
    | 'status'
    | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListOrdersResponse {
  items: AdminOrder[];
  total: number;
  page: number;
  page_size: number;
}

export interface ExportOrdersResponse {
  items: AdminOrder[];
  total: number;
}

export interface OrdersMetrics {
  total_orders: number;
  gross_revenue_cents: number;
  by_status: Record<string, number>;
}

const buildQuery = (params: ListOrdersParams): string => {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.pageSize ?? 20));
  if (params.keyword) qs.set('keyword', params.keyword);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.payment && params.payment !== 'all') qs.set('payment', params.payment);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.restaurantId) qs.set('restaurant_id', params.restaurantId);
  if (params.sortField) qs.set('sort_field', params.sortField);
  if (params.sortOrder) qs.set('sort_order', params.sortOrder);
  return qs.toString();
};

export function listOrders(
  params: ListOrdersParams = {},
): Promise<ListOrdersResponse> {
  return adminRequest<ListOrdersResponse>(
    `/api/admin/orders?${buildQuery(params)}`,
  );
}

export function exportOrders(
  params: ListOrdersParams = {},
): Promise<ExportOrdersResponse> {
  return adminRequest<ExportOrdersResponse>(
    `/api/admin/orders/export?${buildQuery(params)}`,
  );
}

export function getOrdersMetrics(
  params: ListOrdersParams = {},
): Promise<OrdersMetrics> {
  return adminRequest<OrdersMetrics>(
    `/api/admin/orders/metrics?${buildQuery(params)}`,
  );
}

export function getOrder(id: string): Promise<AdminOrder> {
  return adminRequest<AdminOrder>(`/api/admin/orders/${id}`);
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<AdminOrder> {
  return adminRequest<AdminOrder, { status: OrderStatus }>(
    `/api/admin/orders/${id}/status`,
    { method: 'POST', body: { status } },
  );
}

export function refundOrder(id: string): Promise<AdminOrder> {
  return adminRequest<AdminOrder>(`/api/admin/orders/${id}/refund`, {
    method: 'POST',
  });
}

export function deleteOrder(id: string): Promise<void> {
  return adminRequest<void>(`/api/admin/orders/${id}`, { method: 'DELETE' });
}
