import type {
  AdminRestaurant,
  ListRestaurantsParams,
  RestaurantStatus,
} from '@/services/restaurants';

export type RestaurantStatusFilter = RestaurantStatus | 'all';

export interface RestaurantsListState {
  items: AdminRestaurant[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
}

export type RestaurantsQuery = Required<
  Pick<ListRestaurantsParams, 'page' | 'pageSize' | 'sortField' | 'sortOrder'>
> & {
  keyword: string;
  status: RestaurantStatusFilter;
  cuisine: string | 'all';
  city: string | 'all';
};
