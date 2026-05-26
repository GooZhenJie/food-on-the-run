import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import type {
  AdminRestaurant,
  ListRestaurantsParams,
  RestaurantUpsertBody,
} from '@/services/restaurants';
import {
  createRestaurant,
  deleteRestaurant,
  exportRestaurants,
  listRestaurants,
  updateRestaurant,
  updateRestaurantStatus,
} from '@/services/restaurants';
import { downloadCsv } from '@/utils/csv';
import type { RestaurantsListState, RestaurantsQuery } from './type';
import { DEFAULT_PAGE_SIZE } from './config';

const RESTAURANT_CSV_COLUMNS = [
  { header: 'ID', accessor: (r: AdminRestaurant) => r.id },
  { header: 'Name', accessor: (r: AdminRestaurant) => r.name },
  { header: 'Status', accessor: (r: AdminRestaurant) => r.status },
  { header: 'Cuisine', accessor: (r: AdminRestaurant) => r.cuisine },
  { header: 'City', accessor: (r: AdminRestaurant) => r.city },
  { header: 'Owner name', accessor: (r: AdminRestaurant) => r.ownerName },
  { header: 'Owner email', accessor: (r: AdminRestaurant) => r.ownerEmail },
  { header: 'Phone', accessor: (r: AdminRestaurant) => r.phone },
  { header: 'Address', accessor: (r: AdminRestaurant) => r.address },
  { header: 'Rating', accessor: (r: AdminRestaurant) => r.rating },
  { header: 'Orders today', accessor: (r: AdminRestaurant) => r.ordersToday },
  {
    header: 'Revenue MTD (USD)',
    accessor: (r: AdminRestaurant) => (r.revenueMonthCents / 100).toFixed(2),
  },
  { header: 'Created at', accessor: (r: AdminRestaurant) => r.createdAt },
];

export const useRestaurants = (): {
  state: RestaurantsListState;
  query: RestaurantsQuery;
  setPage: (page: number, pageSize?: number) => void;
  setKeyword: (keyword: string) => void;
  setStatus: (status: RestaurantsQuery['status']) => void;
  setCuisine: (cuisine: RestaurantsQuery['cuisine']) => void;
  setCity: (city: RestaurantsQuery['city']) => void;
  setSort: (
    sortField: RestaurantsQuery['sortField'],
    sortOrder: RestaurantsQuery['sortOrder'],
  ) => void;
  refresh: () => Promise<void>;
  create: (body: RestaurantUpsertBody) => Promise<void>;
  update: (id: string, body: Partial<RestaurantUpsertBody>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkRemove: (ids: string[]) => Promise<void>;
  updateStatus: (
    id: string,
    status: AdminRestaurant['status'],
  ) => Promise<void>;
  exportCsv: () => Promise<void>;
} => {
  const [query, setQuery] = useState<RestaurantsQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    keyword: '',
    status: 'all',
    cuisine: 'all',
    city: 'all',
    sortField: 'createdAt',
    sortOrder: 'desc',
  });
  const [state, setState] = useState<RestaurantsListState>({
    items: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    loading: false,
  });

  const fetchList = useCallback(
    async (q: RestaurantsQuery): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const params: ListRestaurantsParams = {
          page: q.page,
          pageSize: q.pageSize,
          keyword: q.keyword || undefined,
          status: q.status === 'all' ? undefined : q.status,
          cuisine: q.cuisine === 'all' ? undefined : q.cuisine,
          city: q.city === 'all' ? undefined : q.city,
          sortField: q.sortField,
          sortOrder: q.sortOrder,
        };
        const res = await listRestaurants(params);
        setState({
          items: res.items,
          total: res.total,
          page: res.page,
          pageSize: res.page_size,
          loading: false,
        });
      } catch (err) {
        setState((prev) => ({ ...prev, loading: false }));
        message.error(err instanceof Error ? err.message : 'Load failed');
      }
    },
    [],
  );

  useEffect(() => {
    fetchList(query);
  }, [fetchList, query]);

  const setPage = useCallback((page: number, pageSize?: number): void => {
    setQuery((prev) => ({
      ...prev,
      page,
      pageSize: pageSize ?? prev.pageSize,
    }));
  }, []);

  const setKeyword = useCallback((keyword: string): void => {
    setQuery((prev) => ({ ...prev, keyword, page: 1 }));
  }, []);

  const setStatus = useCallback((status: RestaurantsQuery['status']): void => {
    setQuery((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setCuisine = useCallback(
    (cuisine: RestaurantsQuery['cuisine']): void => {
      setQuery((prev) => ({ ...prev, cuisine, page: 1 }));
    },
    [],
  );

  const setCity = useCallback((city: RestaurantsQuery['city']): void => {
    setQuery((prev) => ({ ...prev, city, page: 1 }));
  }, []);

  const setSort = useCallback(
    (
      sortField: RestaurantsQuery['sortField'],
      sortOrder: RestaurantsQuery['sortOrder'],
    ): void => {
      setQuery((prev) => ({ ...prev, sortField, sortOrder }));
    },
    [],
  );

  const refresh = useCallback(
    (): Promise<void> => fetchList(query),
    [fetchList, query],
  );

  const create = useCallback(
    async (body: RestaurantUpsertBody): Promise<void> => {
      await createRestaurant(body);
      message.success('Restaurant created');
      await fetchList(query);
    },
    [fetchList, query],
  );

  const update = useCallback(
    async (id: string, body: Partial<RestaurantUpsertBody>): Promise<void> => {
      await updateRestaurant(id, body);
      message.success('Restaurant updated');
      await fetchList(query);
    },
    [fetchList, query],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await deleteRestaurant(id);
      message.success('Restaurant deleted');
      await fetchList(query);
    },
    [fetchList, query],
  );

  const bulkRemove = useCallback(
    async (ids: string[]): Promise<void> => {
      await Promise.all(ids.map((id) => deleteRestaurant(id)));
      message.success(`Deleted ${ids.length} restaurant(s)`);
      await fetchList(query);
    },
    [fetchList, query],
  );

  const updateStatus = useCallback(
    async (id: string, status: AdminRestaurant['status']): Promise<void> => {
      await updateRestaurantStatus(id, status);
      message.success('Status updated');
      await fetchList(query);
    },
    [fetchList, query],
  );

  const exportCsv = useCallback(async (): Promise<void> => {
    try {
      const res = await exportRestaurants({
        keyword: query.keyword || undefined,
        status: query.status === 'all' ? undefined : query.status,
        cuisine: query.cuisine === 'all' ? undefined : query.cuisine,
        city: query.city === 'all' ? undefined : query.city,
        sortField: query.sortField,
        sortOrder: query.sortOrder,
      });
      downloadCsv('restaurants', res.items, RESTAURANT_CSV_COLUMNS);
      message.success(`Exported ${res.total} row(s)`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Export failed');
    }
  }, [query]);

  return {
    state,
    query,
    setPage,
    setKeyword,
    setStatus,
    setCuisine,
    setCity,
    setSort,
    refresh,
    create,
    update,
    remove,
    bulkRemove,
    updateStatus,
    exportCsv,
  };
};
