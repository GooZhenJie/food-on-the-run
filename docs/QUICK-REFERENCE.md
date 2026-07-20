# FOTR Data Fetching - Quick Reference Guide

## 🚀 Three Main Patterns

### Pattern A: Manual useState + useEffect (apps/web)
**When**: Simple one-off data fetches, page-level  
**Where**: `apps/web/src/pages/home/hooks.ts`, `apps/web/src/pages/orders/index.tsx`

```typescript
const [data, setData] = useState<DataType | null>(null);
const [loading, setLoading] = useState(true);
const { message } = App.useApp();

useEffect(() => {
  let cancelled = false;
  const fetch = async () => {
    try {
      const result = await apiCall();
      if (!cancelled) setData(result);
    } catch (e) {
      if (!cancelled) message.error(e instanceof Error ? e.message : 'Error');
    } finally {
      if (!cancelled) setLoading(false);
    }
  };
  fetch();
  return () => { cancelled = true; };
}, [message]);
```

### Pattern B: Custom Hook with useCallback + useState (apps/admin)
**When**: Complex state (pagination, filtering, mutations)  
**Where**: `apps/admin/src/pages/restaurants/hooks.ts`, `apps/admin/src/pages/orders/hooks.ts`

```typescript
const [query, setQuery] = useState<QueryType>({ /* initial */ });
const [state, setState] = useState<StateType>({ /* initial */ });

const fetchList = useCallback(async (q: QueryType) => {
  setState(prev => ({ ...prev, loading: true }));
  try {
    const res = await apiCall(q);
    setState({ items: res.items, total: res.total, loading: false });
  } catch (err) {
    setState(prev => ({ ...prev, loading: false }));
    message.error(err.message);
  }
}, []);

useEffect(() => {
  fetchList(query);
}, [fetchList, query]);

// Mutations refetch on success
const create = useCallback(async (body) => {
  await createApi(body);
  message.success('Created');
  await fetchList(query);  // ← Auto-refetch
}, [fetchList, query]);
```

### Pattern C: useAsyncData + AsyncBoundary (modern)
**When**: Complex async states, refetching, polling  
**Where**: `apps/web/src/pages/restaurant/index.tsx`, `apps/web/src/pages/dashboard/index.tsx`

```typescript
import { useAsyncData } from '@food/shared/hooks/useAsyncData';
import { AsyncBoundary } from '@food/shared/components/AsyncBoundary';

const query = useAsyncData({
  fetcher: async (signal) => {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  deps: [id],                    // Re-fetch when id changes
  interval: 5000,                // Poll every 5s (optional)
  onError: (err) => message.error(err.message),
});

<AsyncBoundary
  status={query.status}          // 'idle' | 'loading' | 'error' | 'empty' | 'success'
  error={query.error}
  onRetry={query.refetch}
  loadingFallback={<Skeleton />}
  errorFallback={<ErrorUI />}
  keepPreviousData={true}        // Overlay spinner during refetch
>
  {query.data && <Content data={query.data} />}
</AsyncBoundary>
```

---

## 📍 HTTP Clients

### apps/web: Umi Request (Axios)
```typescript
// In app.tsx
export const request: RequestConfig = {
  baseURL: '/api',
  requestInterceptors: [(config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  }],
  errorConfig: {
    errorHandler(error) {
      const msg = error?.response?.data?.error || error?.message;
      throw new Error(msg);
    },
  },
};

// In services/
import { request } from 'umi';

export async function listOrders(): Promise<IOrderRow[]> {
  return request<IOrderRow[]>('/customer/orders');
}
```

### apps/admin: Native Fetch
```typescript
// In services/request.ts
export async function adminRequest<T>(
  path: string,
  options: { method?: string; body?: any; signal?: AbortSignal } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body) headers['Content-Type'] = 'application/json';
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 401) {
    clearAuth();
    history.push('/login');  // Auto-redirect
  }

  if (!res.ok) {
    const errBody = await res.clone().json();
    throw new Error(errBody?.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// In services/
export function listRestaurants(params: Params) {
  return adminRequest<Response>(`/api/admin/restaurants?${qs}`, {});
}
```

---

## 🎨 Loading & Error States

### Skeleton Loaders (Tailwind animate-pulse)
```typescript
// Individual skeleton
<div className="bg-gray-200 animate-pulse h-24 rounded-lg" />

// List skeleton
<div className="space-y-3">
  {[1,2,3].map(i => (
    <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
  ))}
</div>

// Custom loading fallback for AsyncBoundary
const LOADING_FALLBACK = (
  <div className="flex flex-col gap-4">
    {[1,2,3].map(i => (
      <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-xl" />
    ))}
  </div>
);

<AsyncBoundary loadingFallback={LOADING_FALLBACK}>
  {/* content */}
</AsyncBoundary>
```

### Empty States
```typescript
// apps/web: Custom
{data.length === 0 ? (
  <div className="flex flex-col items-center py-20 text-gray-400">
    <span className="text-5xl mb-3">🍽️</span>
    <p>No restaurants available yet.</p>
  </div>
) : (
  // content
)}

// AsyncBoundary: Default or custom
<AsyncBoundary
  emptyFallback={
    <div className="text-center py-12">
      <p>No data found</p>
    </div>
  }
>
  {/* content */}
</AsyncBoundary>
```

### Error UI
```typescript
// Toast (most common)
const { message } = App.useApp();
message.error('Failed to load data');

// AsyncBoundary: Default error UI
<AsyncBoundary
  onRetry={query.refetch}
  // Uses default: <Result status="error"> + Retry button
>
  {/* content */}
</AsyncBoundary>

// AsyncBoundary: Custom error UI
<AsyncBoundary
  errorFallback={(error, retry) => (
    <div className="text-center">
      <p>{error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  )}
>
  {/* content */}
</AsyncBoundary>
```

---

## 📊 AsyncStatus Values

```typescript
type AsyncStatus = 
  | 'idle'      // Not started (enabled=false) or waiting to start
  | 'loading'   // Fetching data
  | 'error'     // Error occurred
  | 'empty'     // Data fetched but is empty (Array.length === 0)
  | 'success'   // Data fetched and has content
```

---

## 🔄 Reactive Query Pattern (apps/admin)

```
User changes filter
       ↓
setQuery(prev => ({ ...prev, keyword, page: 1 }))
       ↓
useEffect([fetchList, query]) triggers
       ↓
fetchList(query)
       ↓
setState({ loading: true })
setState({ items, total, loading: false })
```

---

## 🎯 Error Handling Flow

### Request Layer
```
fetch() → fails
   ↓
Custom wrapper/Umi interceptor → extract error message
   ↓
throw new Error(message)
```

### Component Layer
```
try { await apiCall() }
catch (e) { message.error(e.message) }
```

### Recovery
```
1. Toast shown to user
2. User clicks Retry (on AsyncBoundary error UI)
3. query.refetch() called
4. New fetch attempt
```

---

## 🚨 Common Patterns to Watch

### ✅ DO:
- Use `cancelled` flag or AbortSignal for cleanup
- Extract error messages from response
- Show loading skeleton before data appears
- Refetch after mutations
- Use async/await with try/catch

### ❌ DON'T:
- Leave useEffect without cleanup
- Show generic "Error" without message
- Fetch on every render (check deps)
- Mix patterns in same page (pick one)
- Ignore 401 responses

---

## 📦 Type Patterns

### API Services
```typescript
// All requests return Promise<T>
export async function getUser(id: string): Promise<User> { ... }
export async function listUsers(): Promise<User[]> { ... }
export async function getOrders(id: string): Promise<OrderDetail> { ... }
```

### Type Definitions Location
- apps/web: `apps/web/src/services/type.d.ts`
- apps/admin: `apps/admin/src/services/type.d.ts`

### Common Response Shapes
```typescript
// Single item
export interface IUser { id: string; name: string; ... }

// List with pagination
export interface IListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;  // snake_case from backend!
}

// Nested/related data
export interface IOrderDetail {
  order: IOrder;
  items: IOrderItem[];
}
```

---

## 🛠️ Shared Components

### useAsyncData Hook
From `@food/shared/hooks/useAsyncData`

```typescript
const query = useAsyncData<DataType>({
  fetcher: async (signal: AbortSignal) => {
    // Return data or throw error
    const res = await fetch(url, { signal });
    return res.json();
  },
  deps: [id],                    // Re-fetch when dep changes
  enabled: !!id,                 // Disable conditionally
  isEmpty: (data) => !data?.length,  // Custom empty check
  interval: 5000,                // Poll every 5s
  onSuccess: (data) => { ... },
  onError: (error) => { ... },
});

// Returns:
// {
//   status: AsyncStatus,
//   data: DataType | undefined,
//   error: Error | null,
//   isRefetching: boolean,
//   refetch: () => Promise<void>,
//   setData: (updater: Fn) => void,
// }
```

### AsyncBoundary Component
From `@food/shared/components/AsyncBoundary`

```typescript
<AsyncBoundary
  status={status}                   // Or omit to use context
  error={error}
  onRetry={refetch}
  isRefetching={isRefetching}
  
  idleFallback={null}              // When disabled
  loadingFallback={<Spin />}       // When loading
  emptyFallback={<Empty />}        // When empty
  errorFallback={<Error />}        // When error
  
  keepPreviousData={true}          // Overlay spinner during refetch
  className="custom-class"
  aria-label="data list"
>
  {children}  {/* Rendered when success */}
</AsyncBoundary>
```

---

## 🔗 Context Pattern (apps/web)

### Service Component provides context
```typescript
<Service api="/api/data" deps={[id]}>
  <AsyncBoundary>
    {/* Can access query result from context */}
  </AsyncBoundary>
</Service>
```

### Manual context consumption
```typescript
const ctx = useAsyncDataContext<MyType>();
if (!ctx) throw new Error('No service provider');

const { status, data, error } = ctx;
```

---

## 💡 When to Use Which Pattern?

| Situation | Pattern | Example |
|-----------|---------|---------|
| Simple page load | A (Manual) | Home page restaurants |
| Complex filters + pagination | B (Custom Hook) | Admin orders page |
| Polling or complex async | C (useAsyncData) | Dashboard cards |
| Schema-driven rendering | C (useAsyncData) | Restaurant page |
| List with many mutations | B (Custom Hook) | Admin restaurants |

---

## 🎓 Learning Path

1. Start with **Pattern A** (Manual useEffect) → understand basics
2. Upgrade to **Pattern B** (Custom Hook) → handle complex state
3. Standardize on **Pattern C** (useAsyncData) → future-proof

All three coexist in current codebase.

