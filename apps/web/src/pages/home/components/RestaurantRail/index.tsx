import React from 'react';
import { RestaurantCard } from '@/components/RestaurantCard';
import type { IRestaurant } from '@/services/type';

interface IRestaurantRailProps {
  id?: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  data: IRestaurant[];
  loading?: boolean;
  onSeeAll?: () => void;
}

export const RestaurantRail: React.FC<IRestaurantRailProps> = ({
  id,
  title,
  subtitle,
  emoji,
  data,
  loading,
  onSeeAll,
}) => {
  if (!loading && data.length === 0) {
    return null;
  }

  return (
    <section id={id}>
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            {emoji && <span>{emoji}</span>}
            <span>{title}</span>
          </h2>
          {subtitle && (
            <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            See all →
          </button>
        )}
      </div>

      <div className="-mx-4 sm:mx-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 px-4 sm:px-0 pb-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[260px] shrink-0 rounded-2xl bg-gray-100 animate-pulse h-[240px]"
                />
              ))
            : data.map((r) => (
                <RestaurantCard key={r.id} data={r} variant="rail" />
              ))}
        </div>
      </div>
    </section>
  );
};
