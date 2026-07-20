import { RestaurantCard } from '@/pages/home/components/RestaurantCard';
import { useHomeData } from './hooks';

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
          <p className="text-sm text-gray-500 mt-1">
            What would you like to eat today?
          </p>
        </div>

        {/* Restaurant grid */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Restaurants near you
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-gray-100 animate-pulse h-[280px]"
                />
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
