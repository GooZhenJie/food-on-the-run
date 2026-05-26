import React from 'react';
import { StarFilled, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { IRestaurantRow } from '@/services/restaurants';

interface IProps {
  restaurant: IRestaurantRow;
}

export const RestaurantHeader: React.FC<IProps> = ({ restaurant }) => {
  return (
    <div className="relative">
      <div className="relative h-52 sm:h-64 overflow-hidden rounded-b-3xl sm:rounded-3xl">
        <img
          src={restaurant.image_url || 'https://placehold.co/800x400/f59e0b/fff?text=Restaurant'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      <div className="relative -mt-16 mx-4 sm:mx-0">
        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{restaurant.description}</p>
          )}

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                <StarFilled className="text-xs" />
                <span className="text-sm font-semibold">4.7</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <ClockCircleOutlined className="text-sm" />
              <span className="text-sm">25 min</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <EnvironmentOutlined className="text-sm" />
              <span className="text-sm">{restaurant.city}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
