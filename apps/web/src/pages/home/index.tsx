import React, { useMemo } from 'react';
import {
  FireOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  TagsOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { FilterBar, FilterProvider } from '@/components/Filter';
import { useFilterVal } from '@/components/Filter/context';
import { RestaurantCard } from '@/components/RestaurantCard';
import { LocationBar } from './components/LocationBar';
import { HeroCarousel } from './components/HeroCarousel';
import { CuisineShortcuts } from './components/CuisineShortcuts';
import { QuickChips } from './components/QuickChips';
import { RestaurantRail } from './components/RestaurantRail';
import { useHomeData } from './hooks';
import {
  applyHomeFilter,
  pickNew,
  pickPopular,
  pickPromo,
  pickUnder30,
} from './utils';
import type { IRestaurant } from '@/services/type';

interface IAllRestaurantsProps {
  data: IRestaurant[];
  loading: boolean;
}

const AllRestaurants: React.FC<IAllRestaurantsProps> = ({ data, loading }) => {
  const { filterVal } = useFilterVal();

  const filtered = useMemo(
    () => applyHomeFilter(data, filterVal),
    [data, filterVal],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-gray-100 animate-pulse h-[260px]"
          />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-400">
        <SmileOutlined className="text-5xl mb-3" />
        <p className="text-sm">No restaurants match your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {filtered.map((r) => (
        <RestaurantCard key={r.id} data={r} />
      ))}
    </div>
  );
};

export default function HomePage() {
  const { restaurants, banners, cuisines, loading } = useHomeData();

  const popular = useMemo(() => pickPopular(restaurants), [restaurants]);
  const fast = useMemo(() => pickUnder30(restaurants), [restaurants]);
  const fresh = useMemo(() => pickNew(restaurants), [restaurants]);
  const promo = useMemo(() => pickPromo(restaurants), [restaurants]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-8">
        <FilterProvider>
          <LocationBar />

          <HeroCarousel banners={banners} loading={loading} />

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 px-1">
              What are you craving?
            </h2>
            <CuisineShortcuts cuisines={cuisines} loading={loading} />
          </div>

          <QuickChips />

          <RestaurantRail
            id="rail-popular"
            title="Popular near you"
            subtitle="Top-rated kitchens this week"
            icon={<FireOutlined />}
            data={popular}
            loading={loading}
          />

          <RestaurantRail
            id="rail-under-30"
            title="Ready in 30 min"
            subtitle="Fast picks from nearby"
            icon={<ThunderboltOutlined />}
            data={fast}
            loading={loading}
          />

          <RestaurantRail
            id="rail-new"
            title="New on Food on the Run"
            subtitle="Freshly joined this month"
            icon={<GiftOutlined />}
            data={fresh}
            loading={loading}
          />

          <RestaurantRail
            id="rail-promo"
            title="Promos & deals"
            subtitle="Save on your next order"
            icon={<TagsOutlined />}
            data={promo}
            loading={loading}
          />

          <section id="all-restaurants" className="scroll-mt-6">
            <div className="flex items-end justify-between mb-4 px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  All restaurants
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  Browse everything around you
                </p>
              </div>
            </div>
            <FilterBar />
            <AllRestaurants data={restaurants} loading={loading} />
          </section>
        </FilterProvider>
      </div>
    </div>
  );
}
