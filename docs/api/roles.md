# Roles & Permissions API

对应表：`roles`, `permissions`, `role_permissions`, `user_role_assignments`

> 物理表名用 `user_role_assignments`（不是 `user_roles`）以避开 sqlc 生成的 `UserRole` 结构与 `user_role` 枚举同名冲突。业务侧仍叫「user roles」。

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET | `/api/admin/roles` | 列出全部角色（含 permission 代码） | admin |
| GET | `/api/admin/permissions` | 列出全部权限点 | admin |
| GET | `/api/admin/users/:id/roles` | 指定 user 当前持有的 RBAC 角色（含 scope / expires_at） | admin |
| GET | `/api/admin/users/:id/grants` | 指定 user 的 permission override（增权 / 撤权） | admin |
| POST | `/api/admin/roles` | 新建自定义角色（`is_system=FALSE`） | admin + `role:write` |
| PATCH | `/api/admin/roles/:id` | 修改角色显示名 | admin + `role:write` |
| DELETE | `/api/admin/roles/:id` | 软删自定义角色（system 角色禁止；已被引用禁止） | admin + `role:write` |
| PUT | `/api/admin/roles/:id/permissions` | 覆盖式替换角色的权限集合 | admin + `role:write` |
| PUT | `/api/admin/users/:id/roles` | 覆盖式替换指定 user 的 RBAC 角色集合 | admin + `role:write` |
| PUT | `/api/admin/users/:id/roles/:role_id/scope` | 更新（user, role）绑定的 scope + expires_at | admin + `role:write` |
| PUT | `/api/admin/users/:id/grants/:permission_id` | 新增 / 更新 user 级 permission override | admin + `role:write` |
| DELETE | `/api/admin/users/:id/grants/:permission_id` | 删除 user 级 permission override | admin + `role:write` |

所有接口均需 `Authorization: Bearer <access_token>` 且 `persona=admin`。所有写接口额外需要 `role:write` 权限（仅 `admin.super` 内置带有；也可通过 `user_permission_grants` 临时授予其他 admin）。

## Model

```json
// Role
{
  "id": 1,
  "code": "admin.ops",
  "name": "Operations",
  "persona": "admin",
  "is_system": true,
  "permission_codes": ["restaurant:read", "restaurant:write", "..."]
}

// Permission
{
  "id": 7,
  "code": "order:refund",
  "description": "Issue a refund"
}
```

## GET /api/admin/roles

**200**

```json
{
  "items": [
    {
      "id": 1,
      "code": "admin.super",
      "name": "Super Admin",
      "persona": "admin",
      "is_system": true,
      "permission_codes": ["order:read", "order:refund", "..."]
    }
  ]
}
```

按 `persona, code` 排序。`admin.super` 在响应里会展开全部权限点（来自 seed）。

## GET /api/admin/permissions

**200**

```json
{
  "items": [
    { "id": 1, "code": "user:read", "description": "Read user profile" },
    { "id": 2, "code": "user:write", "description": "Modify user profile" }
  ]
}
```

按 `code` 排序。用于 roles 总览页的 tooltip 描述。

## GET /api/admin/users/:id/roles

返回该用户当前被授予、且 persona 匹配的角色明细（含 scope + expires_at）。persona 切换后残留的跨 persona 记录不会返回（由 SQL 过滤）；已过期的绑定也不会出现在返回里。

**200**

```json
{
  "items": [
    {
      "role_id": 2,
      "code": "admin.ops",
      "name": "Operations",
      "persona": "admin",
      "is_system": true,
      "scope": { "restaurant_ids": [101, 102] },
      "expires_at": "2026-06-01T00:00:00Z"
    }
  ]
}
```

字段：
- `scope` — `null` 表示全局生效；对象形式 `{ restaurant_ids?, city_codes? }`，每个维度按 AND 匹配。
- `expires_at` — RFC3339 时间；省略表示永久。

**404** user 不存在。

## PUT /api/admin/users/:id/roles

**Body**

```json
{ "role_codes": ["admin.ops", "admin.cs"] }
```

覆盖式：目标 user 的所有 role 绑定会先 `DELETE`，再 `INSERT` 指定的新集合。传空数组即清空。

**校验**

| 场景 | 响应 |
|---|---|
| 未登录 | `401 missing bearer token` |
| 非 admin persona | `403 admin persona required` |
| admin 但没 `role:write` 权限（例如普通 `admin.ops`） | `403 missing permission: role:write` |
| user 不存在 | `404 user not found` |
| 某个 role code 不存在 | `400 unknown role: <code>` |
| role 的 persona 与目标 user 的 persona 不匹配 | `400 role persona mismatch: <code>` |
| 尝试把自己从 `admin.super` 踢掉 | `400 cannot remove admin.super from yourself` |

**200** 返回持久化后的 role 列表（同 GET 响应结构）。

## 内置角色与权限点

权限点（25 个）：

| Code | 说明 |
|---|---|
| `user:read` | Read user profile |
| `user:write` | Modify user profile |
| `user:impersonate` | Impersonate another user |
| `role:read` | Read RBAC roles and assignments |
| `role:write` | Manage RBAC role assignments |
| `order:read` / `order:cancel` / `order:refund` | 订单读 / 取消 / 退款 |
| `restaurant:read` / `restaurant:write` / `restaurant:publish` | 店铺读 / 写 / 上下架 |
| `menu:read` / `menu:write` | 菜单读 / 写 |
| `promotion:read` / `promotion:write` | 促销读 / 写 |
| `payment:read` | 支付读 |
| `payout:read` / `payout:write` | 分账读 / 写 |
| `schema:read` / `schema:publish` / `schema:delete` | 页面 schema 读 / 发布 / 删除 |
| `delivery:read` / `delivery:accept` / `delivery:complete` | 配送读 / 接单 / 完成 |
| `review:write` | 写评价 |

角色（7 个，均 `is_system = true`）：

| Code | Persona | 绑定权限 |
|---|---|---|
| `admin.super` | admin | 全部（短路 `Can()`） |
| `admin.ops` | admin | restaurant:\* / menu:\* / promotion:\* / schema:\* / user:read |
| `admin.cs` | admin | order:\* / user:read / user:write |
| `admin.finance` | admin | payment:read / payout:\* / order:read |
| `admin.default` | admin | user:read |
| `rider.default` | rider | delivery:\* |
| `customer.default` | customer | review:write / order:read |

## 生命周期联动

1. **新用户注册**（`POST /api/auth/register`）：在同一事务里自动授予 `customer.default`
2. **persona 变更**（`PATCH /api/admin/users/:id/role`）：事务内先清空 `user_role_assignments`，再按新 persona 授予 `<persona>.default`
3. **JWT 签发**：Login / Register / Refresh 都会 `auth.LoadActor(ctx, q, userID, persona)` 重新读取 roles + permissions，塞进 `AccessClaims`
4. **权限变更延迟**：授予 / 回收 role 不会立刻生效，最多 1h 后（access token 过期、刷新时才重新读取）

## 如何新增权限点 / 角色

- **新权限点**：仍走 migration，`INSERT INTO permissions ... ON CONFLICT DO NOTHING`。permission code 是后端代码里的硬编码常量，不开放 UI 新增。
- **新内置 system 角色**：走 migration 写 seed；`is_system = TRUE`。代码短路逻辑依赖 `admin.super`、`<persona>.default` 等固定 code。
- **新自定义角色**：v2.0 起管理端可直接 `POST /api/admin/roles` 创建（`is_system=FALSE`），可在 UI 编辑权限集 / 软删。

## POST /api/admin/roles

**Body**

```json
{ "code": "admin.regional_sg", "name": "Regional Ops (SG)", "persona": "admin" }
```

**校验**

| 场景 | 响应 |
|---|---|
| 缺字段 | `400 code, name and persona are required` |
| `code` 不符合 `^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$` | `400 invalid role code format` |
| `code` 前缀与 `persona` 不匹配 | `400 role code must start with persona prefix: <persona>.` |
| `code` 已存在 | `409 role code already exists` |

**201** 返回新 role（`is_system=false`，permission 为空）。创建后需再调 `PUT /api/admin/roles/:id/permissions` 填充权限。

## PATCH /api/admin/roles/:id

**Body**

```json
{ "name": "Regional Ops (Singapore)" }
```

仅允许修改 display `name`。`code` / `persona` 不可变；system 角色也可改名。

## DELETE /api/admin/roles/:id

**204** 软删成功。

**拒绝**

| 场景 | 响应 |
|---|---|
| `is_system = TRUE` | `400 system role cannot be deleted` |
| 仍有 `user_role_assignments` 引用 | `400 role still assigned to users` |

## PUT /api/admin/roles/:id/permissions

**Body**

```json
{ "permission_codes": ["order:read", "order:refund"] }
```

覆盖式替换；空数组清空权限集。未知 code 返 `400 unknown permission: <code>`。

**200** 返回该 role，`permission_codes` 字段反映新权限集合。

## PUT /api/admin/users/:id/roles/:role_id/scope

绑定已存在时更新 scope + expires_at；不存在时新增绑定。

**Body**

```json
{
  "scope": { "restaurant_ids": [101, 102] },
  "expires_at": "2026-06-01T00:00:00Z"
}
```

任一字段传 `null` 或省略表示"清空"。

**校验**

| 场景 | 响应 |
|---|---|
| role persona 与 user persona 不一致 | `400 role persona mismatch` |
| role 为 `admin.super` 且传入非 null scope | `400 admin.super must remain global (no scope)` |
| `expires_at` 非 RFC3339 | `400 invalid expires_at: ...` |

## GET /api/admin/users/:id/grants

返回该用户所有 permission override（含已过期，便于历史回溯）。

**200**

```json
{
  "items": [
    {
      "user_id": 55,
      "permission_id": 9,
      "permission_code": "order:refund",
      "effect": "allow",
      "scope": null,
      "reason": "代班王五 2026-04-19 ~ 2026-04-21",
      "granted_by": 1,
      "granted_at": "2026-04-19T09:00:00Z",
      "expires_at": "2026-04-21T09:00:00Z"
    }
  ]
}
```

`effect` 枚举：
- `"allow"` — 在 role 权限之上追加（用于临时提权）
- `"deny"` — 从 role 权限中扣除（DENY 优先，用于合规冻结）

## PUT /api/admin/users/:id/grants/:permission_id

**Body**

```json
{
  "effect": "allow",
  "scope": null,
  "reason": "代班王五 2026-04-19 ~ 2026-04-21",
  "expires_at": "2026-04-21T09:00:00Z"
}
```

语义为 upsert：同一 (user, permission) 重复 PUT 会覆盖 effect / scope / expires_at / reason，`granted_by` 更新为当前 actor。

**校验**

| 场景 | 响应 |
|---|---|
| `effect` 不在 `{allow, deny}` | `400 effect must be 'allow' or 'deny'` |
| `reason` 为空 | `400 reason is required` |
| `expires_at` 非 RFC3339 | `400 invalid expires_at: ...` |
| `permission_id` 不存在 | `400 unknown permission id` |

## DELETE /api/admin/users/:id/grants/:permission_id

**204** 幂等；不存在的 grant 也返回 204。

## 权限评估流程（后端每请求一次）

以 `actor.CheckResource(perm, resource)` 为准。`actor` 由 JWT 反序列化，包含 `role_bindings` 和 `grants`：

1. 持有非过期、scope 为 null 的 `admin.super` → **直接通过**（忽略 grants；避免超管被自己的 revoke 锁死）
2. 非过期、匹配 `(perm, resource)` 的 `effect=deny` grant → **拒绝**（DENY 优先）
3. 非过期、匹配 `(perm, resource)` 的 `effect=allow` grant → **通过**
4. 非过期、`PermSet` 包含 `perm` 且 scope 命中 resource 的 role binding → **通过**
5. 否则拒绝

> `Resource{}`（无餐厅 / 无城市）的请求 = 全局判断；会被 `scope != nil` 的 role binding / grant 直接跳过。
