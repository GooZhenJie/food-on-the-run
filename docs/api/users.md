# Users API

对应表：`users`

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/users/me` | 当前用户资料 | ✓ |
| PATCH  | `/api/users/me` | 更新当前用户 | ✓ |
| GET    | `/api/users/:id` | 按 id 查询（管理员） | admin |
| GET    | `/api/admin/users` | 用户列表（管理员） | admin |
| PATCH  | `/api/admin/users/:id/role` | 修改指定用户的 persona 角色 | admin |
| DELETE | `/api/users/me` | 注销账号（软删除） | ✓ |

## Model

```json
{
  "id": "integer",
  "name": "string",
  "email": "string",
  "phone": "string | null",
  "role": "customer | rider | admin",
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

## GET /api/users/me

**200**

```json
{ "id": "...", "name": "...", "email": "...", "role": "customer", ... }
```

## PATCH /api/users/me

**Body**

```json
{ "name": "string?", "phone": "string?" }
```

**200** 返回更新后的 user 对象。

## GET /api/admin/users

需 `Authorization: Bearer <access_token>`，且 token 中 `role=admin`。由 `middleware.RequireAuth` + `middleware.RequireAdmin` 链式校验。

**Query**

| 参数 | 类型 | 说明 |
|---|---|---|
| `page` | int | 页码，默认 1 |
| `page_size` | int | 每页条数，默认 20，最大 100 |
| `role` | `customer \| rider \| admin` | 可选，按角色过滤 |
| `keyword` | string | 可选，按 name / email 模糊匹配（ILIKE） |

**200**

```json
{
  "items": [
    {
      "id": "1",
      "name": "...",
      "email": "...",
      "phone": "...",
      "role": "admin",
      "created_at": "2026-04-19T10:00:00Z",
      "updated_at": "2026-04-19T10:00:00Z"
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 0
}
```

## PATCH /api/admin/users/:id/role

需 `Authorization: Bearer <access_token>`，且 token 中 `role=admin`。

**Body**

```json
{ "role": "customer | rider | admin" }
```

**200** 返回更新后的 user 对象。

**校验**

- `id` 必须为正整数，且存在未软删的 user；否则 `404 user not found`
- `role` 非合法枚举 → `400 invalid role`
- 当 `id` 等于调用方自身且目标 role 不是 `admin` → `400 cannot demote yourself`（防止超管把自己锁在外面）

## DELETE /api/users/me

**204** 无 body。行为：设置 `deleted_at`，吊销所有 sessions。
