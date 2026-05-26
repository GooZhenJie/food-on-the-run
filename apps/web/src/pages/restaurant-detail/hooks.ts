import { useEffect, useState } from 'react';
import { App } from 'antd';
import { getRestaurantById } from '@/services/restaurants';
import { getRestaurantMenu } from '@/services/menu';
import type { IRestaurantRow } from '@/services/restaurants';
import type { IMenuResponse } from '@/services/menu';

interface IRestaurantDetailData {
  restaurant: IRestaurantRow | null;
  menu: IMenuResponse | null;
  loading: boolean;
}

export const useRestaurantDetail = (id: string): IRestaurantDetailData => {
  const [restaurant, setRestaurant] = useState<IRestaurantRow | null>(null);
  const [menu, setMenu] = useState<IMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetch = async () => {
      try {
        const [rest, menuData] = await Promise.all([
          getRestaurantById(id),
          getRestaurantMenu(id),
        ]);
        if (cancelled) return;
        setRestaurant(rest);
        setMenu(menuData);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Failed to load restaurant';
        message.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [id, message]);

  return { restaurant, menu, loading };
};
