import { useEffect, useState } from 'react';
import { App } from 'antd';
import {
  getBannerList,
  getCuisineList,
  getRestaurantList,
} from '@/services/restaurants';
import type {
  IBanner,
  ICuisineShortcut,
  IRestaurant,
} from '@/services/type';

interface IHomeData {
  restaurants: IRestaurant[];
  banners: IBanner[];
  cuisines: ICuisineShortcut[];
  loading: boolean;
  error: string | null;
}

export const useHomeData = (): IHomeData => {
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [cuisines, setCuisines] = useState<ICuisineShortcut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { message } = App.useApp();

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rsp, bsp, csp] = await Promise.all([
          getRestaurantList(),
          getBannerList(),
          getCuisineList(),
        ]);
        if (cancelled) return;
        setRestaurants(rsp);
        setBanners(bsp);
        setCuisines(csp);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Failed to load home data';
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

  return { restaurants, banners, cuisines, loading, error };
};
