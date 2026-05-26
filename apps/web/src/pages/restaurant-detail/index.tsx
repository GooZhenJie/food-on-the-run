import React from 'react';
import { useParams, Link } from 'umi';
import { LeftOutlined } from '@ant-design/icons';
import { RestaurantHeader } from './components/RestaurantHeader';
import { MenuSection } from './components/MenuSection';
import { CartBar } from './components/CartBar';
import { useRestaurantDetail } from './hooks';

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { restaurant, menu, loading } = useRestaurantDetail(id!);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-52 sm:h-64 bg-gray-200 animate-pulse rounded-b-3xl sm:rounded-3xl" />
        <div className="relative -mt-16 mx-4 sm:max-w-3xl sm:mx-auto">
          <div className="bg-white rounded-2xl p-5 shadow-md space-y-3">
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 mt-8 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 p-4 animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
              <div className="w-20 h-20 bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <span className="text-6xl mb-4">🍜</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Restaurant not found</h2>
        <Link
          to="/"
          className="bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-orange-600 transition-colors mt-4"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="sticky top-0 z-30 sm:hidden">
        <Link
          to="/"
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md text-gray-700 hover:bg-white transition-colors"
        >
          <LeftOutlined className="text-sm" />
        </Link>
      </div>

      <div className="hidden sm:block max-w-3xl mx-auto px-4 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors"
        >
          <LeftOutlined className="text-xs" />
          Back to restaurants
        </Link>
      </div>

      <div className="max-w-3xl mx-auto sm:px-4 sm:mt-4">
        <RestaurantHeader restaurant={restaurant} />

        {menu && menu.items.length > 0 ? (
          <div className="px-4 sm:px-0">
            <MenuSection
              categories={menu.categories}
              items={menu.items}
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 text-gray-400 px-4">
            <span className="text-5xl mb-3">📋</span>
            <p className="text-sm">Menu not available yet.</p>
          </div>
        )}
      </div>

      <CartBar />
    </div>
  );
}
