import request from './request';
import type {
  IBanner,
  ICuisineShortcut,
  IGetRestaurantListParams,
  IRestaurant,
} from './type';

export async function getRestaurantList(
  params?: IGetRestaurantListParams,
): Promise<IRestaurant[]> {
  const cleaned: Record<string, string | number> = {};
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') cleaned[k] = v;
    });
  }
  return request<IRestaurant[]>('/restaurants', {
    params: Object.keys(cleaned).length ? cleaned : undefined,
  });
}

export async function getBannerList(): Promise<IBanner[]> {
  return request<IBanner[]>('/banners');
}

export async function getCuisineList(): Promise<ICuisineShortcut[]> {
  return request<ICuisineShortcut[]>('/cuisines');
}
