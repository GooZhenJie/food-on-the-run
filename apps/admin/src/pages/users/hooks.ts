import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import type { TAdminRole } from '@/services/type';
import type {
  AdminUser,
  AdminUserUpsertBody,
  ListAdminUsersParams,
} from '@/services/users';
import {
  banAdminUser,
  createAdminUser,
  deleteAdminUser,
  exportAdminUsers,
  listAdminUsers,
  unbanAdminUser,
  updateAdminUser,
  updateAdminUserRole,
} from '@/services/users';
import { downloadCsv } from '@/utils/csv';
import type { UsersListState, UsersQuery } from './type';
import { DEFAULT_PAGE_SIZE } from './config';

const USER_CSV_COLUMNS = [
  { header: 'ID', accessor: (u: AdminUser) => u.id },
  { header: 'Name', accessor: (u: AdminUser) => u.name },
  { header: 'Email', accessor: (u: AdminUser) => u.email },
  { header: 'Phone', accessor: (u: AdminUser) => u.phone ?? '' },
  { header: 'Role', accessor: (u: AdminUser) => u.role },
  { header: 'Status', accessor: (u: AdminUser) => u.status ?? 'active' },
  { header: 'Orders', accessor: (u: AdminUser) => u.orders_count ?? 0 },
  {
    header: 'Lifetime spend (USD)',
    accessor: (u: AdminUser) =>
      ((u.lifetime_spend_cents ?? 0) / 100).toFixed(2),
  },
  { header: 'Last active', accessor: (u: AdminUser) => u.last_active_at ?? '' },
  { header: 'Created', accessor: (u: AdminUser) => u.created_at },
];

const buildParams = (q: UsersQuery): ListAdminUsersParams => ({
  page: q.page,
  page_size: q.page_size,
  keyword: q.keyword || undefined,
  role: q.role === 'all' ? undefined : q.role,
  status: q.status === 'all' ? undefined : q.status,
  sort_field: q.sort_field,
  sort_order: q.sort_order,
});

export const useUsers = (): {
  state: UsersListState;
  query: UsersQuery;
  setPage: (page: number, pageSize?: number) => void;
  setKeyword: (keyword: string) => void;
  setRole: (role: UsersQuery['role']) => void;
  setStatus: (status: UsersQuery['status']) => void;
  setSort: (
    sort_field: UsersQuery['sort_field'],
    sort_order: UsersQuery['sort_order'],
  ) => void;
  refresh: () => Promise<void>;
  create: (body: AdminUserUpsertBody) => Promise<void>;
  update: (id: string, body: Partial<AdminUserUpsertBody>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkRemove: (ids: string[]) => Promise<void>;
  ban: (id: string) => Promise<void>;
  unban: (id: string) => Promise<void>;
  changeRole: (id: string, role: TAdminRole) => Promise<void>;
  exportCsv: () => Promise<void>;
} => {
  const [query, setQuery] = useState<UsersQuery>({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    keyword: '',
    role: 'all',
    status: 'all',
    sort_field: 'created_at',
    sort_order: 'desc',
  });
  const [state, setState] = useState<UsersListState>({
    items: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    loading: false,
  });

  const fetchList = useCallback(async (q: UsersQuery): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await listAdminUsers(buildParams(q));
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

  useEffect(() => {
    fetchList(query);
  }, [fetchList, query]);

  const setPage = useCallback((page: number, pageSize?: number): void => {
    setQuery((prev) => ({
      ...prev,
      page,
      page_size: pageSize ?? prev.page_size,
    }));
  }, []);

  const setKeyword = useCallback((keyword: string): void => {
    setQuery((prev) => ({ ...prev, keyword, page: 1 }));
  }, []);

  const setRole = useCallback((role: UsersQuery['role']): void => {
    setQuery((prev) => ({ ...prev, role, page: 1 }));
  }, []);

  const setStatus = useCallback((status: UsersQuery['status']): void => {
    setQuery((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setSort = useCallback(
    (
      sort_field: UsersQuery['sort_field'],
      sort_order: UsersQuery['sort_order'],
    ): void => {
      setQuery((prev) => ({ ...prev, sort_field, sort_order }));
    },
    [],
  );

  const refresh = useCallback(
    (): Promise<void> => fetchList(query),
    [fetchList, query],
  );

  const create = useCallback(
    async (body: AdminUserUpsertBody): Promise<void> => {
      await createAdminUser(body);
      message.success('User created');
      await fetchList(query);
    },
    [fetchList, query],
  );

  const update = useCallback(
    async (id: string, body: Partial<AdminUserUpsertBody>): Promise<void> => {
      await updateAdminUser(id, body);
      message.success('User updated');
      await fetchList(query);
    },
    [fetchList, query],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await deleteAdminUser(id);
      message.success('User deleted');
      await fetchList(query);
    },
    [fetchList, query],
  );

  const bulkRemove = useCallback(
    async (ids: string[]): Promise<void> => {
      await Promise.all(ids.map((id) => deleteAdminUser(id)));
      message.success(`Deleted ${ids.length} user(s)`);
      await fetchList(query);
    },
    [fetchList, query],
  );

  const ban = useCallback(
    async (id: string): Promise<void> => {
      await banAdminUser(id);
      message.success('User banned');
      await fetchList(query);
    },
    [fetchList, query],
  );

  const unban = useCallback(
    async (id: string): Promise<void> => {
      await unbanAdminUser(id);
      message.success('User reinstated');
      await fetchList(query);
    },
    [fetchList, query],
  );

  const changeRole = useCallback(
    async (id: string, role: TAdminRole): Promise<void> => {
      await updateAdminUserRole(id, role);
      message.success('Role updated');
      await fetchList(query);
    },
    [fetchList, query],
  );

  const exportCsv = useCallback(async (): Promise<void> => {
    try {
      const res = await exportAdminUsers(buildParams(query));
      downloadCsv('users', res.items, USER_CSV_COLUMNS);
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
    setRole,
    setStatus,
    setSort,
    refresh,
    create,
    update,
    remove,
    bulkRemove,
    ban,
    unban,
    changeRole,
    exportCsv,
  };
};
