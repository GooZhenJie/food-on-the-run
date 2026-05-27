import { request } from 'umi';

export interface IMenuCategoryRow {
  id: number;
  restaurant_id: number;
  name: string;
  sort_order: number;
}

export interface IMenuItemRow {
  id: number;
  restaurant_id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price_amount: number;
  is_available: boolean;
}

export interface IMenuResponse {
  categories: IMenuCategoryRow[];
  items: IMenuItemRow[];
}

export async function getRestaurantMenu(restaurantId: string | number): Promise<IMenuResponse> {
  return request<IMenuResponse>(`/public/restaurants/${restaurantId}/menu`);
}
