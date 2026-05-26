import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import type {
  AdminOrder,
  ListOrdersParams,
  OrderStatus,
} from '@/services/orders';
import {
  deleteOrder,
  exportOrders,
  getOrdersMetrics,
  listOrders,
  refundOrder,
  updateOrderStatus,
} from '@/services/orders';
import { downloadCsv } from '@/utils/csv';
import type { OrdersListState, OrdersMetricsState, OrdersQuery } from './type';
import { DEFAULT_PAGE_SIZE } from './config';

const ORDER_CSV_COLUMNS = [
  { header: 'Order ID', accessor: (o: AdminOrder) => o.id },
  { header: 'Customer', accessor: (o: AdminOrder) => o.customerName },
  { header: 'Email', accessor: (o: AdminOrder) => o.customerEmail },
  { header: 'Phone', accessor: (o: AdminOrder) => o.customerPhone },
  { header: 'Restaurant', accessor: (o: AdminOrder) => o.restaurantName },
  { header: 'Rider', accessor: (o: AdminOrder) => o.riderName ?? '' },
  { header: 'Status', accessor: (o: AdminOrder) => o.status },
  { header: 'Payment', accessor: (o: AdminOrder) => o.paymentMethod },
  { header: 'Items', accessor: (o: AdminOrder) => o.items.length },
  {
    header: 'Subtotal (USD)',
    accessor: (o: AdminOrder) => (o.subtotalCents / 100).toFixed(2),
  },
  {
    header: 'Delivery (USD)',
    accessor: (o: AdminOrder) => (o.deliveryFeeCents / 100).toFixed(2),
  },
  {
    header: 'Total (USD)',
    accessor: (o: AdminOrder) => (o.totalCents / 100).toFixed(2),
  },
  { header: 'Address', accessor: (o: AdminOrder) => o.deliveryAddress },
  { header: 'Note', accessor: (o: AdminOrder) => o.note },
  { header: 'Created', accessor: (o: AdminOrder) => o.createdAt },
];

const buildParams = (q: OrdersQuery): ListOrdersParams => ({
  page: q.page,
  pageSize: q.pageSize,
  keyword: q.keyword || undefined,
  status: q.status === 'all' ? undefined : q.status,
  payment: q.payment === 'all' ? undefined : q.payment,
  from: q.from || undefined,
  to: q.to || undefined,
  sortField: q.sortField,
  sortOrder: q.sortOrder,
});

export const useOrders = (): {
  state: OrdersListState;
  metrics: OrdersMetricsState;
  query: OrdersQuery;
  setPage: (page: number, pageSize?: number) => void;
  setKeyword: (keyword: string) => void;
  setStatus: (status: OrdersQuery['status']) => void;
  setPayment: (payment: OrdersQuery['payment']) => void;
  setDateRange: (from: string, to: string) => void;
  setSort: (
    sortField: OrdersQuery['sortField'],
    sortOrder: OrdersQuery['sortOrder'],
  ) => void;
  refresh: () => Promise<void>;
  changeStatus: (id: string, status: OrderStatus) => Promise<void>;
  refund: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkChangeStatus: (ids: string[], status: OrderStatus) => Promise<void>;
  exportCsv: () => Promise<void>;
} => {
  const [query, setQuery] = useState<OrdersQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    keyword: '',
    status: 'all',
    payment: 'all',
    from: '',
    to: '',
    sortField: 'createdAt',
    sortOrder: 'desc',
  });
  const [state, setState] = useState<OrdersListState>({
    items: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    loading: false,
  });
  const [metrics, setMetrics] = useState<OrdersMetricsState>({
    totalOrders: 0,
    grossRevenueCents: 0,
    byStatus: {},
    loading: false,
  });

  const fetchList = useCallback(async (q: OrdersQuery): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await listOrders(buildParams(q));
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
  }, []);

  const fetchMetrics = useCallback(async (q: OrdersQuery): Promise<void> => {
    setMetrics((prev) => ({ ...prev, loading: true }));
    try {
      const res = await getOrdersMetrics(buildParams(q));
      setMetrics({
        totalOrders: res.total_orders,
        grossRevenueCents: res.gross_revenue_cents,
        byStatus: res.by_status,
        loading: false,
      });
    } catch {
      setMetrics((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchList(query);
    fetchMetrics(query);
  }, [fetchList, fetchMetrics, query]);

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

  const setStatus = useCallback((status: OrdersQuery['status']): void => {
    setQuery((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setPayment = useCallback((payment: OrdersQuery['payment']): void => {
    setQuery((prev) => ({ ...prev, payment, page: 1 }));
  }, []);

  const setDateRange = useCallback((from: string, to: string): void => {
    setQuery((prev) => ({ ...prev, from, to, page: 1 }));
  }, []);

  const setSort = useCallback(
    (
      sortField: OrdersQuery['sortField'],
      sortOrder: OrdersQuery['sortOrder'],
    ): void => {
      setQuery((prev) => ({ ...prev, sortField, sortOrder }));
    },
    [],
  );

  const refresh = useCallback(
    (): Promise<void> => fetchList(query),
    [fetchList, query],
  );

  const changeStatus = useCallback(
    async (id: string, status: OrderStatus): Promise<void> => {
      await updateOrderStatus(id, status);
      message.success('Order status updated');
      await fetchList(query);
      await fetchMetrics(query);
    },
    [fetchList, fetchMetrics, query],
  );

  const refund = useCallback(
    async (id: string): Promise<void> => {
      await refundOrder(id);
      message.success('Order refunded');
      await fetchList(query);
      await fetchMetrics(query);
    },
    [fetchList, fetchMetrics, query],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await deleteOrder(id);
      message.success('Order removed');
      await fetchList(query);
      await fetchMetrics(query);
    },
    [fetchList, fetchMetrics, query],
  );

  const bulkChangeStatus = useCallback(
    async (ids: string[], status: OrderStatus): Promise<void> => {
      await Promise.all(ids.map((id) => updateOrderStatus(id, status)));
      message.success(`Updated ${ids.length} order(s)`);
      await fetchList(query);
      await fetchMetrics(query);
    },
    [fetchList, fetchMetrics, query],
  );

  const exportCsv = useCallback(async (): Promise<void> => {
    try {
      const res = await exportOrders(buildParams(query));
      downloadCsv('orders', res.items, ORDER_CSV_COLUMNS);
      message.success(`Exported ${res.total} row(s)`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Export failed');
    }
  }, [query]);

  return {
    state,
    metrics,
    query,
    setPage,
    setKeyword,
    setStatus,
    setPayment,
    setDateRange,
    setSort,
    refresh,
    changeStatus,
    refund,
    remove,
    bulkChangeStatus,
    exportCsv,
  };
};
