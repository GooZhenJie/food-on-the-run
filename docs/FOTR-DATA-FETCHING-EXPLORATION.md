# FOTR Monorepo: Data Fetching, Error Handling & Loading States - Complete Exploration

**Date:** May 27, 2026  
**Scope:** apps/web, apps/admin, packages/shared  
**Coverage:** Very Thorough

---

## 📊 Executive Summary

The FOTR (food-on-the-run) monorepo uses a **multi-layered data fetching architecture**:

1. **apps/web**: Uses Umi's built-in `request` plugin (Axios-based) + custom `useAsyncData` hook
2. **apps/admin**: Uses custom `adminRequest` fetch wrapper + manual `useCallback`/`useState` patterns
3. **packages/shared**: Provides reusable primitives (`useAsyncData`, `AsyncBoundary`) for async UI handling
4. **Error Handling**: Mix of Antd's `App.useApp()` message system and custom error boundaries
5. **Loading States**: Inline skeleton loaders (Tailwind `animate-pulse`), no centralized skeleton library

---

## 1. DATA FETCHING PATTERNS

### 1.1 apps/web - Umi Request Plugin + Custom Hooks

#### Configuration (.umirc.ts)
```typescript
plugins: [
  '@umijs/plugins/dist/initial-state',
  '@umijs/plugins/dist/model',
  '@umijs/plugins/dist/request',  // ← Axios-based request plugin
],

request: {},  // Empty config; uses app.tsx RequestConfig

mock: false,
proxy: {
  "/api": {
    target: "http://localhost:8080",
    changeOrigin: true,
  },
}
```

#### Umi Request Interception (app.tsx)
```typescript
export const request: RequestConfig = {
  baseURL: '/api',
  requestInterceptors: [
    (config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      }
      return config;
    },
  ],
  errorConfig: {
    errorHandler(error) {
      // Extract error message from response
      const serverMsg = error?.response?.data?.error || error?.response?.data?.message;
      if (serverMsg) throw new Error(serverMsg);
      throw error;
    },
  },
};
```

#### API Services (apps/web/src/services/)
Simple function-based API calls using Umi's `request` function:

**Example: apps/web/src/services/orders.ts**
```typescript
import { request } from 'umi';

export async function listMyOrders(): Promise<IOrderRow[]> {
  return request<IOrderRow[]>('/customer/orders');
}

export async function getOrderDetail(id: string | number): Promise<IOrderDetailResponse> {
  return request<IOrderDetailResponse>(`/customer/orders/${id}`);
}

export async function payOrder(id: string | number): Promise<IOrderRow> {
  return request<IOrderRow>(`/customer/orders/${id}/pay`, { method: 'POST' });
}
```

**Pattern:**
- All request logic in `/services/*.ts`
- No data transformation; raw API response returned
- Type definitions in `type.d.ts`
- Uses Umi's `request()` which is Axios under the hood

#### Data Fetching in Pages (useAsyncData + Manual Hooks)

**Pattern 1: Manual useEffect + useState (apps/web/src/pages/orders/index.tsx)**
```typescript
const [orders, setOrders] = useState<IOrderRow[]>([]);
const [loading, setLoading] = useState(true);
const { message } = App.useApp();

useEffect(() => {
  let cancelled = false;
  const fetch = async () => {
    try {
      const data = await listMyOrders();
      if (!cancelled) setOrders(data);
    } catch (e) {
      if (!cancelled) {
        const msg = e instanceof Error ? e.message : 'Failed to load orders';
        message.error(msg);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  };
  fetch();
  return () => { cancelled = true; };
}, [message]);
```

**Pattern 2: Custom Hook (apps/web/src/pages/home/hooks.ts)**
```typescript
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
    return () => { cancelled = true; };
  }, [message]);

  return { restaurants, loading, error };
};
```

**Key Features:**
- Cancellation token pattern (AbortController-like) via `cancelled` flag
- Cleanup on unmount
- Error message extraction and toast via `message.error()`
- Separate loading and error states

#### Pattern 3: useAsyncData Hook (apps/web/src/pages/restaurant/index.tsx)

```typescript
import { useAsyncData } from '@food/shared/hooks/useAsyncData';
import { AsyncBoundary } from '@food/shared/components/AsyncBoundary';

export default function RestaurantPage() {
  const query = useAsyncData<ISchemaNode>({
    fetcher: async () => {
      try {
        const res = await fetchPublicPageSchema('/restaurant');
        return res.schema_data ?? (RESTAURANT_PAGE_SCHEMA as ISchemaNode);
      } catch {
        return RESTAURANT_PAGE_SCHEMA as ISchemaNode;
      }
    },
  });

  return (
    <AsyncBoundary
      status={query.status}
      error={query.error}
      onRetry={query.refetch}
      isRefetching={query.isRefetching}
      loadingFallback={LOADING_FALLBACK}
    >
      {query.data ? <Render schema={query.data} /> : null}
    </AsyncBoundary>
  );
}
```

---

### 1.2 apps/admin - Custom Fetch Wrapper + State Management

#### Custom Request Wrapper (apps/admin/src/services/request.ts)

```typescript
export async function adminRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const { method = 'GET', body, signal } = options;

  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    signal,
  });

  // 401 handling: clear auth and redirect
  if (res.status === 401 && path.startsWith('/api/admin/')) {
    clearAuth();
    history.push('/login');
  }

  if (!res.ok) {
    let messageText = `Request failed with status ${res.status}`;
    try {
      const errBody = await res.clone().json();
      if (errBody?.error) messageText = errBody.error;
      else if (errBody?.message) messageText = errBody.message;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) messageText = text;
    }
    throw new Error(messageText);
  }

  if (res.status === 204) {
    return undefined as TResponse;
  }
  return (await res.json()) as TResponse;
}
```

**Features:**
- Native Fetch API (not Axios)
- AbortSignal support for request cancellation
- 401 auto-redirect to login
- Error message extraction from response body
- Supports both JSON and text error responses

#### API Services (apps/admin/src/services/restaurants.ts)

```typescript
export function listRestaurants(
  params: ListRestaurantsParams = {},
): Promise<ListRestaurantsResponse> {
  return adminRequest<ListRestaurantsResponse>(
    `/api/admin/restaurants?${buildQuery(params)}`,
  );
}

export function createRestaurant(body: RestaurantUpsertBody): Promise<AdminRestaurant> {
  return adminRequest<AdminRestaurant, RestaurantUpsertBody>(
    '/api/admin/restaurants',
    { method: 'POST', body },
  );
}
```

#### Data Fetching in Pages (Manual useCallback + useState)

**apps/admin/src/pages/restaurants/hooks.ts**

```typescript
export const useRestaurants = () => {
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
        const params: ListRestaurantsParams = { /* ...query transform... */ };
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

  // Filter setters trigger state update → useEffect → fetch
  const setKeyword = useCallback((keyword: string): void => {
    setQuery((prev) => ({ ...prev, keyword, page: 1 }));
  }, []);

  // Mutations trigger fetchList on success
  const create = useCallback(
    async (body: RestaurantUpsertBody): Promise<void> => {
      await createRestaurant(body);
      message.success('Restaurant created');
      await fetchList(query);  // ← Refetch after mutation
    },
    [fetchList, query],
  );

  return {
    state,
    query,
    setPage,
    setKeyword,
    refresh,
    create,
    update,
    remove,
    // ... more methods
  };
};
```

**Pattern:**
- Reactive: query state change → triggers useEffect → calls fetchList
- Mutations: handle API call, show toast, then refetch list
- Single loading state for entire list
- Error message extraction and toast via `message.error()`

---

### 1.3 packages/shared - Reusable Async Primitives

#### useAsyncData Hook (packages/shared/src/hooks/useAsyncData/index.ts)

Core features:
- AbortController for cancellation
- Request deduplication (incrementing fetchId)
- Mounted tracking to prevent state updates after unmount
- Polling support with interval
- Custom empty data detection
- Success/error callbacks
- Manual refetch and optimistic setData

#### Canonical AsyncStatus

```typescript
type AsyncStatus = 'idle' | 'loading' | 'error' | 'empty' | 'success';
```

Used consistently across `useAsyncData`, `<Service>`, and `<AsyncBoundary>`.

#### AsyncBoundary Component

**Default UI:**
- **Loading:** `<Spin />` centered
- **Error:** `<Result status="error">` with Retry button
- **Empty:** `<Empty />`

**Features:**
- Imperative props OR context-based
- Custom fallback renderers
- keepPreviousData mode (overlay spinner during refetch)

#### Service Component (apps/web/src/components/Service/index.tsx)

Wrapper that provides `useAsyncData` result via context, used in schema-driven rendering.

---

## 2. ERROR HANDLING PATTERNS

### 2.1 Request-Level Error Handling

#### apps/web - Umi Request Error Config
Errors extracted and thrown in interceptor.

#### apps/admin - Custom Request Error Handling
- 401 auto-redirect to login
- Error message extraction from response body (JSON or text)
- AbortSignal support

### 2.2 Component-Level Error Handling

#### Toast via App.useApp()
Most common pattern across both apps:
```typescript
const { message } = App.useApp();
message.error(error.message);
```

#### AsyncBoundary Error UI
Default error UI with Retry button, or custom error fallback.

#### No Error Boundary Component
- No React Error Boundary found
- Runtime errors not caught at component tree level
- Only catch errors in async/await try-catch

### 2.3 Error Recovery

- Manual refetch via AsyncBoundary onRetry
- Auto-redirect on 401
- Mutation auto-refetch on success

---

## 3. LOADING & EMPTY STATE PATTERNS

### 3.1 Loading Indicators

#### Inline Skeleton Loaders (Tailwind animate-pulse)
- No centralized skeleton components
- Each page rolls its own skeleton design
- Uses Tailwind `animate-pulse` class

#### AsyncBoundary Loading Fallback
- Default: `<Spin />` centered
- Custom: pass `loadingFallback` prop with skeleton design

### 3.2 Empty State Handling

#### apps/web Pages
- Check array length
- Custom emoji + message
- Centered layout with flex

#### AsyncBoundary Empty Fallback
- Default: `<Empty />`
- Custom: pass `emptyFallback` prop

### 3.3 Refetching State (keepPreviousData)
Overlays semi-transparent spinner on top of previous data during background refetch.

---

## 4. PROJECT STRUCTURE

### apps/web/src
- **services/**: API functions + type.d.ts
- **pages/**: Page components with hooks or inline useAsyncData
- **components/**: Service wrapper component
- **wrappers/**: AuthGuard wrapper

### apps/admin/src
- **services/**: Custom fetch wrapper + API functions + type.d.ts
- **pages/**: Page components with custom hooks (useCallback + useState)
- **components/**: AdminLayout component

### packages/shared/src
- **hooks/useAsyncData/**: Reusable async data hook
- **components/AsyncBoundary/**: Error/loading/empty boundary
- **utils/cn.ts**: Utility for combining classes

---

## 5. KEY DIFFERENCES: apps/web vs apps/admin

| Aspect | apps/web | apps/admin |
|--------|----------|-----------|
| **HTTP Client** | Umi request plugin (Axios) | Native Fetch API |
| **Data Fetching** | Manual useState + useEffect OR useAsyncData | Manual useState + useEffect + useCallback |
| **State Management** | Distributed per page hook | Centralized in page hooks |
| **Error UI** | AsyncBoundary error fallback | Modal.error() dialog |
| **Auth Interception** | Umi request interceptor | Custom fetch wrapper |
| **Mutations** | Per-function, then refetch | useCallback, then refetch |
| **Pagination** | N/A | Implemented |
| **Async Primitives** | Uses shared utilities | Manual implementation |

---

## 6. DEPENDENCIES

### apps/web
- `umi@4.6.25` (includes axios@0.27.2, @ahooksjs/use-request@2.8.15)
- `antd@6.3.6`

### apps/admin
- `umi@4.6.25`
- `antd@6.3.6`
- `dayjs@1.11.19`

### Notably Absent
- React Query / TanStack Query ❌
- SWR ❌
- React Request Hook ❌

---

## 7. CONTEXT & STATE MANAGEMENT

### Umi initialState Plugin
Provides `currentUser` via `useModel('@@initialState')`.

### Custom Contexts
- **CartProvider**: Shopping cart state (apps/web)
- **AsyncDataContext**: useAsyncData result (packages/shared)

---

## 8. GAPS & OBSERVATIONS

### ✅ What Works Well
- Clear separation of concerns (services → pages → hooks)
- Consistent error message extraction
- Type-safe API responses
- Cancel-on-unmount prevention
- Polling support in useAsyncData
- Flexible AsyncBoundary

### ⚠️ Areas for Improvement

1. **No Error Boundaries** - Runtime errors not caught at component level
2. **No Skeleton Components** - Each page hardcodes its own
3. **Inconsistent Patterns** - Mix of manual useState and useAsyncData
4. **No Optimistic Updates** - setData() exists but rarely used
5. **No Request Deduplication** - Multiple identical requests could race
6. **No Pagination in apps/web** - Only admin has pagination
7. **Inconsistent Loading States** - Some pages show skeleton, some show Spin

---

## 9. RECOMMENDED NEXT STEPS

### Option A: Standardize on useAsyncData + AsyncBoundary
Migrate all apps/web and apps/admin pages to use shared primitives.

### Option B: Introduce React Query
For centralized cache, deduplication, and easier pagination/infinite queries.

### Option C: Create Shared Skeleton Components
Build reusable CardSkeleton, ListSkeleton, TableSkeleton components.

---

## Conclusion

FOTR uses a **lightweight, manual approach** to data fetching without external state management libraries. It's pragmatic and flexible, with solid foundations in `useAsyncData` and `AsyncBoundary`. The main opportunity is **standardizing patterns across apps** and creating reusable UI components for loading/error states.
