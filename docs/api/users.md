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
| GET    | `/api/admin/users/:id/roles` | 获取指定用户的 RBAC 角色列表 | admin |
| PUT    | `/api/admin/users/:id/roles` | 覆盖式替换 RBAC 角色集合 | admin + `role:write` |
| GET    | `/api/admin/users/:id/scope` | 获取指定用户的 ABAC scope 摘要 | admin |
| DELETE | `/api/users/me` | 注销账号（软删除） | ✓ |

`/roles` 结尾的 RBAC 细粒度接口详见 [roles.md](./roles.md)。

## 本地开发种子

`000033_seed_dev_admin`：若不存在 `admin@fotr.local`，则插入 `users` + 密码凭证（`admin1234`，bcrypt cost 12）+ `admin.super` 角色绑定。`000033` 的 `down` 会删除该邮箱用户及其 sessions、credentials、RBAC 行。

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
{ "role": "customer | rider | merchant | admin" }
```

**200** 返回更新后的 user 对象。

**校验**

- `id` 必须为正整数，且存在未软删的 user；否则 `404 user not found`
- `role` 非合法枚举 → `400 invalid role`
- 当 `id` 等于调用方自身且目标 role 不是 `admin` → `400 cannot demote yourself`（防止超管把自己锁在外面）

**副作用**

- 事务内清空 `user_role_assignments`（即原 persona 下的所有 RBAC 角色），再授予新 `<persona>.default`
- 写一行 `audit_logs`（`action = user.persona_change`）
- 响应里 `roles` / `permissions` 字段仅反映该用户在 **下次登录 / token refresh 之后** 的状态；调用方要想同步新权限需要用户重新签发 token

## GET /api/admin/users/:id/scope

返回指定 user 的 ABAC scope 摘要。admin 控制台打开「Edit roles」drawer 时拉取该端点展示所持店铺。

**200** — persona = merchant

```json
{
  "persona": "merchant",
  "restaurant_ids": [12, 18],
  "restaurants": [
    { "id": 12, "name": "Pizzeria Bella" },
    { "id": 18, "name": "Sushi Spot" }
  ]
}
```

**200** — 其他 persona（`restaurants` 永远为空数组）

```json
{ "persona": "admin", "restaurant_ids": [], "restaurants": [] }
```

**404** user 不存在。

## DELETE /api/users/me

**204** 无 body。行为：设置 `deleted_at`，吊销所有 sessions。
