import React from 'react';
import {
  StarFilled,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { IHeroBannerProps } from './type';

export const HeroBanner: React.FC<IHeroBannerProps> = ({
  title,
  subtitle,
  image,
  rating,
  deliveryTime,
  address,
}) => {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-6">
      <img src={image} alt={title} className="w-full h-56 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
        <h1 className="text-white text-3xl font-bold">{title}</h1>
        <p className="text-white/80 mt-1">{subtitle}</p>
        <div className="flex gap-4 mt-3 text-sm text-white/90">
          <span className="inline-flex items-center gap-1">
            <StarFilled className="text-amber-400" /> {rating}
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockCircleOutlined /> {deliveryTime} min
          </span>
          <span className="inline-flex items-center gap-1">
            <EnvironmentOutlined /> {address}
          </span>
        </div>
      </div>
    </div>
  );
};
