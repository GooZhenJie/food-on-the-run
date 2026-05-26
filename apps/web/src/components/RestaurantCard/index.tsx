import React from 'react';
import { Link } from 'umi';
import { StarFilled, EnvironmentOutlined } from '@ant-design/icons';
import type { IRestaurantCardProps } from './type';

export const RestaurantCard: React.FC<IRestaurantCardProps> = ({
  data,
  variant = 'grid',
}) => {
  const {
    id,
    name,
    image,
    rating,
    deliveryTime,
    deliveryFee,
    hasFreeDelivery,
    hasPromo,
    promoLabel,
    isNew,
    isHalal,
    address,
    cuisine,
  } = data;

  const isRail = variant === 'rail';

  return (
    <Link
      to={`/restaurant?id=${id}`}
      className={`block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow ${
        isRail ? 'w-[260px] shrink-0' : ''
      }`}
    >
      <div className="relative">
        <img
          src={image}
          alt={name}
          className={`w-full object-cover ${isRail ? 'h-36' : 'h-44'}`}
        />
        {hasPromo && promoLabel && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-[11px] font-semibold rounded-full px-2.5 py-1 shadow-sm">
            {promoLabel}
          </span>
        )}
        {isNew && (
          <span className="absolute top-3 right-3 bg-white/95 text-orange-600 text-[11px] font-bold rounded-full px-2.5 py-1 shadow-sm">
            NEW
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
            {name}
          </h3>
          <span className="text-[11px] bg-orange-50 text-orange-600 rounded-full px-2 py-0.5 capitalize whitespace-nowrap font-medium">
            {cuisine}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[13px] text-gray-600">
          <span className="flex items-center gap-1">
            <StarFilled className="text-amber-500" />
            <span className="font-semibold text-gray-800">{rating}</span>
          </span>
          <span className="text-gray-300">·</span>
          <span>{deliveryTime} min</span>
          <span className="text-gray-300">·</span>
          <span className={hasFreeDelivery ? 'text-green-600 font-semibold' : ''}>
            {hasFreeDelivery ? 'Free delivery' : `RM${deliveryFee.toFixed(0)} delivery`}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-xs text-gray-400 truncate flex-1 inline-flex items-center gap-1">
            <EnvironmentOutlined />
            <span className="truncate">{address}</span>
          </p>
          {isHalal && (
            <span className="text-[10px] bg-green-50 text-green-700 rounded-md px-1.5 py-0.5 font-semibold">
              HALAL
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
