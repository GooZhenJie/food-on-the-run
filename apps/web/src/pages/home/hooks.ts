import { useEffect, useState } from 'react';
import { App } from 'antd';
import { getRestaurantList } from '@/services/restaurants';
import type { IRestaurantRow } from '@/services/restaurants';

interface IHomeData {
  restaurants: IRestaurantRow[];
  loading: boolean;
  error: string | null;
}

export const useHomeData = (): IHomeData => {
  const [restaurants, setRestaurants] = useState<IRestaurantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { message } = App.useApp();

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRestaurantList();
        if (cancelled) return;
        setRestaurants(data);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Failed to load restaurants';
        setError(msg);
        message.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [message]);

  return { restaurants, loading, error };
};
