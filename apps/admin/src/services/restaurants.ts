import { adminRequest } from './request';

export interface AdminRestaurant {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'suspended';
  ownerEmail: string;
  createdAt: string;
}

export interface ListRestaurantsResponse {
  items: AdminRestaurant[];
  total: number;
}

export function listRestaurants(params: {
  page: number;
  pageSize: number;
}): Promise<ListRestaurantsResponse> {
  const qs = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  }).toString();
  return adminRequest<ListRestaurantsResponse>(`/api/admin/restaurants?${qs}`);
}
