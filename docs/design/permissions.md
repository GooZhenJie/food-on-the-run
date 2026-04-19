# FOTR 权限系统设计

> 版本：v1.0 · 最后更新：2026-04-19
> 参考实现：Grab、Uber、DoorDash 的 Identity / Authorization / Data Scope 三层模型

## 目录

- [1. 设计目标](#1-设计目标)
- [2. 三层模型](#2-三层模型)
- [3. 数据库 Schema](#3-数据库-schema)
- [4. 依赖库](#4-依赖库)
- [5. 后端使用方式](#5-后端使用方式)
- [6. 前端使用方式](#6-前端使用方式)
- [7. 内置角色与权限点](#7-内置角色与权限点)
- [8. 分阶段落地计划](#8-分阶段落地计划)
- [9. 安全与审计](#9-安全与审计)
- [10. 已知限制与取舍](#10-已知限制与取舍)

---

## 1. 设计目标

FOTR 同时服务 **消费者（apps/web）**、**骑手（rider app，TBD）**、**商家（merchant app，TBD）**、**内部员工（apps/admin）** 四类身份。权限系统必须满足：

- **粗粒度路由控制**：决定一个用户能登录哪个 app、能访问哪些路由前缀
- **细粒度操作控制**：同一个 admin 身份下，客服能改订单但不能发菜单；运营能改菜单但不能碰财务
- **数据行级控制**：商家只能看自己店的订单；地区运营只能看自己城市
- **可配置、可审计**：角色与权限通过 DB 表管理，所有敏感操作落 `audit_logs`

## 2. 三层模型

```
┌──────────────────┐    ┌────────────────────┐    ┌──────────────────┐
│  Identity        │    │  Authorization     │    │  Data Scope      │
│  (你是谁)         │───▶│  (你能做什么)       │───▶│  (你能看哪些数据) │
│  Persona         │    │  RBAC              │    │  ABAC            │
│  users.role      │    │  roles +           │    │  JWT.scopes +    │
│                  │    │  permissions       │    │  SQL WHERE 过滤  │
└──────────────────┘    └────────────────────┘    └──────────────────┘
```

### 2.1 Identity — Persona

`users.role` 枚举保留，决定 **登录入口和顶层路由前缀**：

| Persona | 登录入口 | 路由前缀 |
|---|---|---|
| `customer` | apps/web | `/api/*` |
| `rider` | rider app | `/api/rider/*` |
| `merchant` | merchant app | `/api/merchant/*` |
| `admin` | apps/admin | `/api/admin/*` |

Persona 是用户的「硬属性」，一人一值，不可多选。切换 persona = 切换 app。

### 2.2 Authorization — RBAC

Persona 内部按 **角色（role）** 细分，每个角色绑定一组 **权限点（permission）**。一个用户在同一 persona 内可以有多个角色，权限并集生效。

```
User ──N:N──> Role ──N:N──> Permission
       (user_roles)    (role_permissions)
```

权限点命名规范：`<resource>:<action>`，全小写，蛇形分词用 `_`：

- `order:read` / `order:refund` / `order:cancel`
- `restaurant:read` / `restaurant:write` / `restaurant:publish`
- `schema:read` / `schema:publish`
- `user:impersonate`

### 2.3 Data Scope — ABAC

登录签发 JWT 时根据用户属性（`restaurants.owner_user_id`、`rider_profiles.city_code` 等）计算 `scopes`，并塞进 access token：

```json
{
  "user_id": 123,
  "persona": "merchant",
  "roles": ["merchant.owner"],
  "permissions": ["restaurant:write", "order:read"],
  "scopes": {
    "restaurant_ids": [42, 58],
    "city_codes": ["SG-01"]
  }
}
```

Handler 层查询时强制按 scope 过滤，**绝不信任 request body 里的 restaurant_id**。

## 3. 数据库 Schema

### 3.1 已有表（不改）

```sql
CREATE TYPE user_role AS ENUM ('customer', 'rider', 'merchant', 'admin');

CREATE TABLE users (
  id         BIGSERIAL PRIMARY KEY,
  role       user_role NOT NULL DEFAULT 'customer',
  ...
);
```

> **变更点**：`user_role` 枚举新增 `merchant`，需要一条 migration：`ALTER TYPE user_role ADD VALUE 'merchant'`。

### 3.2 新增表（migration 编号顺延）

```sql
-- 000028_create_roles.up.sql
CREATE TABLE roles (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(64)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  persona     user_role    NOT NULL,
  is_system   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_roles_code ON roles(code);
CREATE INDEX idx_roles_persona ON roles(persona);

-- 000029_create_permissions.up.sql
CREATE TABLE permissions (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(128) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_permissions_code ON permissions(code);

-- 000030_create_role_permissions.up.sql
CREATE TABLE role_permissions (
  role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- 000031_create_user_roles.up.sql (physical table: user_role_assignments)
CREATE TABLE user_role_assignments (
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id    BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by BIGINT REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
CREATE INDEX idx_user_role_assignments_role_id ON user_role_assignments(role_id);
```

> 实现细节：物理表取名 `user_role_assignments`，避开 sqlc 把 `user_roles` 生成为与 `user_role` 枚举同名的 `UserRole` struct 的冲突。`000032_seed_rbac.up.sql` 同步：内置角色/权限/绑定 + 现网 admin 用户自动获得 `admin.super` + 所有用户自动获得 `<persona>.default`。

### 3.3 Scope 相关字段

不新增 scope 表，scope 从现有业务表派生：

| Scope 字段 | 来源 |
|---|---|
| `restaurant_ids` | `SELECT id FROM restaurants WHERE owner_user_id = $1` |
| `city_codes` | `SELECT city_code FROM rider_profiles WHERE user_id = $1` 或 admin 表扩展 |

> 后续如需 admin 区域经理类，再加 `user_city_scopes(user_id, city_code)` 关联表。

## 4. 依赖库

### 4.1 后端（apps/server）

| 库 | 版本 | 用途 | 已引入 |
|---|---|---|---|
| `github.com/golang-jwt/jwt/v5` | `5.3.1` | JWT 签发与解析 | ✅ |
| `github.com/jackc/pgx/v5` | `5.9.1` | PostgreSQL 驱动 | ✅ |
| `github.com/golang-migrate/migrate/v4` | `4.19.1` | 数据库 migration | ✅ |
| `golang.org/x/crypto/bcrypt` | `0.50.0` | 密码哈希 | ✅ |

**不引入新库。** 现有栈足够。自己实现 `auth/rbac.go`（权限加载、Actor、Can 判断），避免引入 Casbin 等重型框架（对 FOTR 这种规模是过度工程）。

### 4.2 前端（apps/web、apps/admin）

不引入新库。权限点从登录响应里拿到后，存在 Zustand store（或项目现有的 auth store）里，组件里用一个小 hook `useCan('order:refund')` 判断。

## 5. 后端使用方式

### 5.1 目录约定

```
apps/server/
├── auth/
│   ├── token.go          # 已有 — JWT 签发/解析
│   ├── password.go       # 已有 — bcrypt
│   └── rbac.go           # 新增 — Actor / Can / LoadPermissions
├── middleware/
│   ├── cors.go           # 已有
│   ├── auth.go           # 新增 — RequireAuth / RequirePersona / RequirePermission
│   └── audit.go          # 新增 — 写 audit_logs
├── db/
│   ├── queries/
│   │   ├── roles.sql            # 新增
│   │   ├── permissions.sql      # 新增
│   │   └── user_roles.sql       # 新增
│   └── migrations/
│       └── 000028_* ~ 000031_*  # 新增
```

### 5.2 Actor 结构

```go
// auth/rbac.go
package auth

type Actor struct {
    UserID      int64
    Persona     string              // 'customer' | 'rider' | 'merchant' | 'admin'
    Roles       []string            // ['admin.ops']
    Permissions map[string]struct{} // {'order:read': {}, 'order:refund': {}}
    Scopes      Scopes
}

type Scopes struct {
    RestaurantIDs []int64  `json:"restaurant_ids,omitempty"`
    CityCodes     []string `json:"city_codes,omitempty"`
}

// 超管短路
func (a *Actor) Can(perm string) bool {
    if a.hasRole("admin.super") {
        return true
    }
    _, ok := a.Permissions[perm]
    return ok
}
```

### 5.3 JWT Claims 扩展

```go
// auth/token.go
type AccessClaims struct {
    UserID      int64    `json:"user_id"`
    Persona     string   `json:"persona"`
    Roles       []string `json:"roles"`
    Permissions []string `json:"perms"`   // 编码时用数组，解码后转 map
    Scopes      Scopes   `json:"scopes,omitempty"`
    jwt.RegisteredClaims
}
```

### 5.4 中间件

```go
// middleware/auth.go
func RequireAuth(next http.Handler) http.Handler { ... }      // 校验 JWT，注入 Actor 到 ctx
func RequirePersona(p string) func(http.Handler) http.Handler // 校验 Persona
func RequirePermission(perm string) func(http.Handler) http.Handler // 校验权限点
var RequireAdmin = RequirePersona("admin")
```

路由注册示例：

```go
// main.go
adminMux := http.NewServeMux()
adminMux.Handle("POST /api/admin/schemas/publish",
    middleware.RequirePermission("schema:publish")(
        middleware.Audit("schema.publish")(
            http.HandlerFunc(ph.AdminPublish),
        ),
    ),
)

mux.Handle("/api/admin/", middleware.RequireAuth(middleware.RequireAdmin(adminMux)))
```

### 5.5 Handler 里拿 Actor

```go
func (h *OrderHandler) List(w http.ResponseWriter, r *http.Request) {
    actor := middleware.ActorFrom(r.Context())
    if !actor.Can("order:read") {
        handlers.WriteError(w, http.StatusForbidden, "forbidden")
        return
    }
    // Scope 过滤：商家只能看自己店的订单
    orders, err := h.q.ListOrdersByRestaurants(r.Context(), actor.Scopes.RestaurantIDs)
    ...
}
```

**强约束**：任何跨租户表（orders、payments、payouts 等）的查询都必须走 `ByRestaurants` / `ByUserID` / `ByCityCodes` 这类带 scope 的 query 名，不允许写裸的 `ListOrders`。

### 5.6 权限点代码常量

```go
// auth/permissions.go
package auth

const (
    PermOrderRead   = "order:read"
    PermOrderRefund = "order:refund"
    PermOrderCancel = "order:cancel"

    PermRestaurantRead    = "restaurant:read"
    PermRestaurantWrite   = "restaurant:write"
    PermRestaurantPublish = "restaurant:publish"

    PermSchemaRead    = "schema:read"
    PermSchemaPublish = "schema:publish"

    PermUserImpersonate = "user:impersonate"
)
```

DB 表里的 permissions 记录只是这些常量的镜像，给 admin 管理页面展示用。

## 6. 前端使用方式

### 6.1 登录响应扩展

`/api/auth/login` 响应 `user` 对象新增字段：

```json
{
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "persona": "admin",
    "roles": ["admin.ops"],
    "permissions": ["order:read", "order:refund"],
    "scopes": { "city_codes": ["SG-01"] }
  },
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600
}
```

### 6.2 auth store（apps/admin、apps/web 各一份）

```ts
// src/utils/auth.ts — 扩展现有实现
type AuthState = {
  user: User | null;
  can: (perm: string) => boolean;
  ...
};
```

### 6.3 组件里用 hook

```tsx
// src/hooks/useCan.ts
export const useCan = (perm: string): boolean => {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (user.roles?.includes('admin.super')) return true;
  return user.permissions?.includes(perm) ?? false;
};
```

```tsx
const canRefund = useCan('order:refund');
return canRefund ? <RefundButton /> : null;
```

### 6.4 路由级守卫

```tsx
// apps/admin/src/layouts/index.tsx
if (!user) return <Navigate to="/login" />;
if (user.persona !== 'admin') return <Navigate to="/403" />;
```

## 7. 内置角色与权限点

migration seed 内置以下角色（`is_system = true`，不可删除）：

### admin persona

| Role code | 包含权限（示例） |
|---|---|
| `admin.super` | `*`（Can 函数短路；持有 `role:write` 可改他人 RBAC） |
| `admin.ops` | `restaurant:*`, `menu:*`, `schema:*`, `promotion:*`, `user:read` |
| `admin.cs` | `order:read`, `order:refund`, `order:cancel`, `user:read`, `user:write` |
| `admin.finance` | `payment:read`, `payout:*`, `order:read` |
| `admin.default` | `user:read`（persona 切到 admin 时默认授予，待超管提权） |

### merchant persona

| Role code | 包含权限 |
|---|---|
| `merchant.owner` | `restaurant:write`, `menu:write`, `order:read`, `payout:read`（scope 限定自己的店） |
| `merchant.staff` | `order:read`, `menu:read` |

### rider persona

| Role code | 包含权限 |
|---|---|
| `rider.default` | `delivery:read`, `delivery:accept`, `delivery:complete` |

### customer persona

| Role code | 包含权限 |
|---|---|
| `customer.default` | `order:create`, `order:read_own`, `review:write` |

## 8. 分阶段落地计划

### Phase 1 — 堵安全洞（已完成）

- [x] 新增 `auth/actor.go` 与 `middleware/auth.go`：`RequireAuth` / `RequirePersona` / `RequireAdmin` / `RequirePermission` / `ActorFrom`
- [x] 所有 `/api/admin/*` 路由统一走 `RequireAuth + RequireAdmin` 中间件链（见 `main.go` 的 `adminMux`）
- [x] JWT 解析结果注入 `*auth.Actor` 到 `context`，handler 通过 `middleware.ActorFrom(ctx)` 获取
- [x] 新增管理端 `GET /api/admin/users` 与 `PATCH /api/admin/users/:id/role`，并在 admin 控制台新建 `Permissions` 菜单供超管直接修改 persona
- [x] 防自降级：后端拒绝 `id == actor.UserID && role != admin`，前端 Select 同时在 UI 上屏蔽

**不动 DB 表结构**，只把现有 role 字段真正用起来。`merchant` 枚举值延后到 Phase 3，避开 `golang-migrate` 对 `ALTER TYPE ADD VALUE` 的事务包裹限制。

### Phase 2 — 引入 RBAC（已完成）

- [x] migration 000028 ~ 000032（roles / permissions / role_permissions / **user_role_assignments** / seed）
- [x] seed 内置 25 个权限点 + 7 个系统角色（`admin.super/ops/cs/finance/default` + `rider.default` + `customer.default`）
- [x] 登录 / 注册 / refresh 时通过 `auth.LoadActor` 读取 roles + permissions 塞进 JWT claims
- [x] `middleware.RequirePermission(perm)` 在 `PUT /api/admin/users/:id/roles` 上生效（仅 `admin.super` 通过）
- [x] admin 控制台 `Permissions` 菜单重构为 Tabs：Users（persona + RBAC 按钮）/ System roles（只读总览）；`Edit roles` 按钮仅 `admin.super` 可点

> 实现细节：物理表名用 `user_role_assignments` 而不是 `user_roles`，因为 sqlc 会把 `user_roles` 表生成为 `UserRole` struct，与已有的 `user_role` 枚举对应的 `UserRole` struct 重名。业务层仍叫 "user roles"。

### Phase 3 — ABAC Data Scope（已完成）

- [x] `restaurants.owner_id` 字段已存在（migration 000004），无需新增
- [x] 新增 migration 000034（merchant enum）+ 000035（merchant.owner / staff / default 角色 seed）
- [x] `auth.LoadActor` 计算 `scopes.restaurant_ids`（merchant persona 按 `owner_id` 查 `restaurants`），塞进 JWT `AccessClaims.Scopes`
- [x] 跨租户 query 全部 `*By<Scope>` / `*In<Scope>` 命名：`ListRestaurantIDsByOwner` / `ListRestaurantsByOwner` / `ListOrdersByRestaurants` / `CountOrdersByRestaurants` / `GetOrderInRestaurants` / `UpdateOrderStatusInRestaurants`
- [x] merchant 端 4 个核心端点：`GET /api/merchant/restaurants`、`GET /api/merchant/restaurants/{id}`、`GET /api/merchant/orders`、`PATCH /api/merchant/orders/{id}/status`；均挂 `RequireAuth + RequireMerchant`
- [x] `handlers/merchant.go` 所有查询强制传 `actor.Scopes.RestaurantIDs`，scope 为空直接返回空列表，从不打 DB 全表
- [x] `middleware.Audit` 落 `audit_logs`，覆盖 5 个写接口（见 [docs/api/audit-logs.md](../api/audit-logs.md)）
- [x] admin 控制台 `Edit roles` drawer 现在展示 merchant user 名下店铺摘要（`GET /api/admin/users/{id}/scope`）
- [x] `.cursor/skills/postgresql-naming-conventions/SKILL.md` 新增跨租户查询命名硬约束

**merchant 端前端 app**：独立项目，不在本仓库范围内。

## 9. 安全与审计

### 9.1 审计日志

所有 **admin 写操作** 和 **所有 refund、impersonate** 走 `middleware.Audit("<action>")`，落 `audit_logs`：

```json
{
  "actor_id": 42,
  "action": "schema.publish",
  "resource_type": "page_schema",
  "resource_id": "home",
  "before": { ... },
  "after":  { ... },
  "ip": "1.2.3.4",
  "user_agent": "..."
}
```

### 9.2 JWT 安全

- `JWT_SECRET` 走环境变量，生产环境 ≥ 64 bytes 随机
- access token TTL = 1h，refresh token TTL = 30d
- refresh token 存 DB（`sessions` 表），支持服务端吊销
- 任何权限变更后，用户 **最多 1h 后生效**（access 过期后 refresh 时重新拉权限）

### 9.3 权限变更流程

1. 超管在 admin 页面修改某 role 的 permissions
2. 不主动踢用户下线
3. 用户下次 refresh token 时（≤1h）拉到最新 permissions
4. 变更记录落 `audit_logs`，`action = role.update_permissions`

## 10. 已知限制与取舍

| 取舍 | 方案 | 代价 |
|---|---|---|
| JWT 携带 permissions 数组 | 减少每请求 DB 查询 | token 体积 ~1KB；权限变更延迟最多 1h |
| 不引入 Casbin | 自己写 `Can()` 几十行 | 表达不了 ReBAC / 复杂策略，FOTR 用不到 |
| 不做主动踢下线 | 实现简单 | 超管误删权限后需等 1h 恢复；紧急情况走「清空用户所有 session」兜底 |
| 不支持角色继承 | 扁平 role + 组合 | 授权略冗余，但调试直观，不会出现「为什么这人有这权限」的迷路 |
| Scope 过滤靠 handler 自觉 | 命名约定 + code review | 依赖开发纪律；缓解：跨租户 query 必须带 `By*` 后缀，review 必查 |
| 超管 bypass 所有 Can 判断 | `admin.super` 短路 | 一旦超管账号被盗影响面大；缓解：超管账号强制开 2FA + 所有操作落审计 |
| `merchant.staff` 无 user 绑定途径 | Phase 3 仅支持 `merchant.owner`（scope 来自 `restaurants.owner_id`） | 当真有 staff 需求时再补 `restaurant_staff_assignments(user_id, restaurant_id)` |
| `scopes.city_codes` 在 JWT 里占位但未计算 | 设计留接口，无业务方使用 | 后续若加「区域经理 admin」再补 |
| scope 变更（admin 改 `owner_id`）最多延迟 1h | 不做主动踢下线 | 紧急生效需手动清空 `sessions` 强制重登 |
| Audit 写入异步、失败只记 log | 保证不拖慢主响应 | 极小概率丢 1~2 条审计；acceptable for FOTR scale |

---

## 附录：相关文档

- API 文档：[../api/auth.md](../api/auth.md)、[../api/merchant.md](../api/merchant.md)、[../api/audit-logs.md](../api/audit-logs.md)
- 后端约定：`.cursor/skills/go-server-conventions/SKILL.md`
- DB 命名约定：`.cursor/skills/postgresql-naming-conventions/SKILL.md`
