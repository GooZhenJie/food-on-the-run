import type { IRestaurant } from '@/services/type';

export interface IRestaurantCardProps {
  data: IRestaurant;
  variant?: 'grid' | 'rail';
}
