import { adminRequest } from './request';

export type RestaurantStatus = 'active' | 'pending' | 'suspended';

export interface AdminRestaurant {
  id: string;
  name: string;
  cuisine: string;
  status: RestaurantStatus;
  ownerEmail: string;
  ownerName: string;
  city: string;
  phone: string;
  address: string;
  rating: number;
  ordersToday: number;
  revenueMonthCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListRestaurantsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: RestaurantStatus | 'all';
  cuisine?: string | 'all';
  city?: string | 'all';
  sortField?:
    | 'name'
    | 'rating'
    | 'ordersToday'
    | 'revenueMonthCents'
    | 'status'
    | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListRestaurantsResponse {
  items: AdminRestaurant[];
  total: number;
  page: number;
  page_size: number;
}

export interface ExportRestaurantsResponse {
  items: AdminRestaurant[];
  total: number;
}

export interface RestaurantUpsertBody {
  name: string;
  cuisine?: string;
  status?: RestaurantStatus;
  ownerEmail: string;
  ownerName?: string;
  city?: string;
  phone?: string;
  address?: string;
}

const buildQuery = (params: ListRestaurantsParams): string => {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page ?? 1));
  qs.set('page_size', String(params.pageSize ?? 20));
  if (params.keyword) qs.set('keyword', params.keyword);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.cuisine && params.cuisine !== 'all') qs.set('cuisine', params.cuisine);
  if (params.city && params.city !== 'all') qs.set('city', params.city);
  if (params.sortField) qs.set('sort_field', params.sortField);
  if (params.sortOrder) qs.set('sort_order', params.sortOrder);
  return qs.toString();
};

export function listRestaurants(
  params: ListRestaurantsParams = {},
): Promise<ListRestaurantsResponse> {
  return adminRequest<ListRestaurantsResponse>(
    `/api/admin/restaurants?${buildQuery(params)}`,
  );
}

export function exportRestaurants(
  params: ListRestaurantsParams = {},
): Promise<ExportRestaurantsResponse> {
  return adminRequest<ExportRestaurantsResponse>(
    `/api/admin/restaurants/export?${buildQuery(params)}`,
  );
}

export function getRestaurant(id: string): Promise<AdminRestaurant> {
  return adminRequest<AdminRestaurant>(`/api/admin/restaurants/${id}`);
}

export function createRestaurant(
  body: RestaurantUpsertBody,
): Promise<AdminRestaurant> {
  return adminRequest<AdminRestaurant, RestaurantUpsertBody>(
    '/api/admin/restaurants',
    { method: 'POST', body },
  );
}

export function updateRestaurant(
  id: string,
  body: Partial<RestaurantUpsertBody>,
): Promise<AdminRestaurant> {
  return adminRequest<AdminRestaurant, Partial<RestaurantUpsertBody>>(
    `/api/admin/restaurants/${id}`,
    { method: 'PATCH', body },
  );
}

export function deleteRestaurant(id: string): Promise<void> {
  return adminRequest<void>(`/api/admin/restaurants/${id}`, { method: 'DELETE' });
}

export function updateRestaurantStatus(
  id: string,
  status: RestaurantStatus,
): Promise<AdminRestaurant> {
  return adminRequest<AdminRestaurant, { status: RestaurantStatus }>(
    `/api/admin/restaurants/${id}/status`,
    { method: 'POST', body: { status } },
  );
}
