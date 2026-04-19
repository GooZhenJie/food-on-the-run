import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import type { TAdminRole } from '@/services/type';
import type { AdminUser } from '@/services/users';
import { listAdminUsers, updateAdminUserRole } from '@/services/users';
import type {
  PermissionsListState,
  PermissionsQuery,
  PermissionsRoleFilter,
} from './type';
import { DEFAULT_PAGE_SIZE } from './config';

export const useAdminUsers = (): {
  state: PermissionsListState;
  query: PermissionsQuery;
  setPage: (page: number, pageSize?: number) => void;
  setRole: (role: PermissionsRoleFilter) => void;
  setKeyword: (keyword: string) => void;
  refresh: () => Promise<void>;
  updateRole: (user: AdminUser, role: TAdminRole) => Promise<void>;
} => {
  const [query, setQuery] = useState<PermissionsQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    role: 'all',
    keyword: '',
  });
  const [state, setState] = useState<PermissionsListState>({
    items: [],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    loading: false,
  });

  const fetchList = useCallback(async (q: PermissionsQuery): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await listAdminUsers({
        page: q.page,
        page_size: q.pageSize,
        role: q.role === 'all' ? undefined : q.role,
        keyword: q.keyword || undefined,
      });
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
      pageSize: pageSize ?? prev.pageSize,
    }));
  }, []);

  const setRole = useCallback((role: PermissionsRoleFilter): void => {
    setQuery((prev) => ({ ...prev, role, page: 1 }));
  }, []);

  const setKeyword = useCallback((keyword: string): void => {
    setQuery((prev) => ({ ...prev, keyword, page: 1 }));
  }, []);

  const refresh = useCallback((): Promise<void> => fetchList(query), [
    fetchList,
    query,
  ]);

  const updateRole = useCallback(
    async (user: AdminUser, role: TAdminRole): Promise<void> => {
      try {
        await updateAdminUserRole(user.id, role);
        message.success(`Updated ${user.email} to ${role}`);
        await fetchList(query);
      } catch (err) {
        message.error(err instanceof Error ? err.message : 'Update failed');
        throw err;
      }
    },
    [fetchList, query],
  );

  return { state, query, setPage, setRole, setKeyword, refresh, updateRole };
};
