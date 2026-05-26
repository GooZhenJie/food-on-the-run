import request from './request';

// Backend returns this shape from the restaurants table
export interface IRestaurantRow {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  address_line_1: string;
  city: string;
  postcode: string;
  lat: string | null;
  lng: string | null;
  phone: string | null;
  is_open: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function getRestaurantList(): Promise<IRestaurantRow[]> {
  return request<IRestaurantRow[]>('/public/restaurants');
}

export async function getRestaurantById(id: string | number): Promise<IRestaurantRow> {
  return request<IRestaurantRow>(`/public/restaurants/${id}`);
}
