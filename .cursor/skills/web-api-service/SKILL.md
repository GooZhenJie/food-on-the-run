---
name: web-api-service
description: >-
  Enforces conventions for the API service layer in apps/web/src/services/.
  Use immediately when:
  1. Adding a new API call function;
  2. Creating or modifying any file under src/services/;
  3. Replacing mock data with a real API call.
---

# Web API Service Conventions — apps/web

## Location

All API call functions live in `src/services/`. One file per backend resource.

```
src/services/
├── restaurants.ts   # all /api/restaurants/* calls
├── orders.ts        # all /api/orders/* calls
├── users.ts         # all /api/users/* calls
└── dashboard.ts     # all /api/dashboard/* calls
```

---

## Base Request Helper

Create `src/services/request.ts` once and reuse it everywhere:

```ts
const BASE_URL = '/api';

interface IRequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

async function request<T>(path: string, options: IRequestOptions = {}): Promise<T> {
  const { params, ...init } = options;
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    );
    url += `?${qs.toString()}`;
  }
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export default request;
```

---

## Naming Conventions

| Action | Function name pattern | Example |
|---|---|---|
| Fetch a list | `get<Resource>List` | `getRestaurantList` |
| Fetch one by id | `get<Resource>ById` | `getRestaurantById` |
| Create | `create<Resource>` | `createOrder` |
| Update | `update<Resource>` | `updateOrder` |
| Delete | `delete<Resource>` | `deleteOrder` |

---

## Service File Structure

```ts
// src/services/restaurants.ts
import request from './request';
import type { IRestaurant, IGetRestaurantListParams } from './type.d';

export async function getRestaurantList(params?: IGetRestaurantListParams): Promise<IRestaurant[]> {
  return request<IRestaurant[]>('/restaurants', { params });
}

export async function getRestaurantById(id: string): Promise<IRestaurant> {
  return request<IRestaurant>(`/restaurants/${id}`);
}
```

---

## Type Definitions

Service types live in `src/services/type.d.ts`:

```ts
// src/services/type.d.ts

export interface IRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: number;
  address: string;
  image: string;
}

export interface IGetRestaurantListParams {
  cuisine?: string;
  category?: string;
}

export interface IApiError {
  error: string;
}
```

---

## Rules

- **Never call `fetch` directly in a component or page** — always go through a service function
- **Never hardcode `/api` prefix in a service function** — it belongs in the base `request` helper
- All functions are `async` and return a typed `Promise<T>` — no `Promise<any>`
- When mock data is active (Umi dev), service functions still work — Umi intercepts the fetch via `src/mock/api.ts`
- When replacing a mock with a real call, delete the mock route entry in `src/mock/api.ts` at the same time

---

## Mock Alignment

Every service function must match a route in `src/mock/api.ts` during development:

```ts
// src/mock/api.ts
export default {
  'GET /api/restaurants': RESTAURANTS,     // ← aligned with getRestaurantList()
  'GET /api/restaurants/:id': RESTAURANT,  // ← aligned with getRestaurantById()
};
```

---

## Checklist

- [ ] File placed in `src/services/<resource>.ts`
- [ ] Types defined in `src/services/type.d.ts`
- [ ] Function name follows `get/create/update/delete` + resource pattern
- [ ] Function is `async`, returns `Promise<T>` with a concrete type
- [ ] `fetch` called only through the `request` helper, not directly
- [ ] Matching mock route exists in `src/mock/api.ts` (until real API is live)
- [ ] When real API is ready, mock route removed from `src/mock/api.ts`
