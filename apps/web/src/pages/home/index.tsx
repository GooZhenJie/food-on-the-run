import React from 'react';
import { Link } from 'umi';
import { StarFilled, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useHomeData } from './hooks';
import type { IRestaurantRow } from '@/services/restaurants';

const RestaurantCard: React.FC<{ data: IRestaurantRow }> = ({ data }) => {
  return (
    <Link
      to={`/restaurant-detail/${data.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative">
        <img
          src={data.image_url || 'https://placehold.co/400x240/f59e0b/fff?text=Restaurant'}
          alt={data.name}
          className="w-full h-44 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
          {data.name}
        </h3>
        {data.description && (
          <p className="text-[13px] text-gray-500 mt-1 line-clamp-1">{data.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-[13px] text-gray-600">
          <span className="flex items-center gap-1">
            <StarFilled className="text-amber-500" />
            <span className="font-semibold text-gray-800">4.7</span>
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <ClockCircleOutlined className="text-xs" />
            25 min
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-emerald-600 font-medium">Free delivery</span>
        </div>
        <p className="text-xs text-gray-400 truncate mt-1.5 flex items-center gap-1">
          <EnvironmentOutlined />
          {data.address_line_1}, {data.city}
        </p>
      </div>
    </Link>
  );
};

export default function HomePage() {
  const { restaurants, loading } = useHomeData();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Good afternoon 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">What would you like to eat today?</p>
        </div>

        {/* Restaurant grid */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Restaurants near you</h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-[280px]" />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <span className="text-5xl mb-3">🍽️</span>
              <p className="text-sm">No restaurants available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {restaurants.map((r) => (
                <RestaurantCard key={r.id} data={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
