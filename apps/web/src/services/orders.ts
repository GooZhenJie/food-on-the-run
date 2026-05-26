import request from './request';
import type { ICartItem } from '@/services/type';

export interface ICreateOrderParams {
  restaurant_id: number;
  items: { menu_item_id: number; quantity: number; note?: string }[];
  note?: string;
}

export interface IOrderRow {
  id: number;
  customer_id: number;
  restaurant_id: number;
  status: string;
  subtotal_amount: number;
  delivery_fee_amount: number;
  total_amount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  restaurant_name?: string;
  restaurant_image?: string;
}

export interface IOrderItemRow {
  id: number;
  order_id: number;
  menu_item_id: number;
  name: string;
  price_amount: number;
  quantity: number;
}

export interface IOrderDetailResponse {
  order: IOrderRow;
  items: IOrderItemRow[];
}

export async function createOrder(params: ICreateOrderParams): Promise<IOrderRow> {
  return request<IOrderRow>('/customer/orders', {
    method: 'POST',
    data: params,
  });
}

export async function listMyOrders(): Promise<IOrderRow[]> {
  return request<IOrderRow[]>('/customer/orders');
}

export async function getOrderDetail(id: string | number): Promise<IOrderDetailResponse> {
  return request<IOrderDetailResponse>(`/customer/orders/${id}`);
}

export async function payOrder(id: string | number): Promise<IOrderRow> {
  return request<IOrderRow>(`/customer/orders/${id}/pay`, { method: 'POST' });
}
