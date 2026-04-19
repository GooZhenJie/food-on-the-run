# FOTR 权限系统 v2.0 — 第四阶段计划

> 版本：v2.0 · 最后更新：2026-04-19
> 前置阅读：[permissions.md](./permissions.md) v1.0（Phase 1~3 已完成）
> 状态：**Phase 4 已落地**（migration 000036~000037；auth/check.go + 27 个单测；role CRUD + user grants + scope/expires_at UI；审计全覆盖）
> 实际工期：1 天集中实现（约 12 人时）

## 目录

- [1. 背景与动机](#1-背景与动机)
- [2. 能力差距矩阵](#2-能力差距矩阵)
- [3. 范围与非范围](#3-范围与非范围)
- [4. 数据库 Schema 变更](#4-数据库-schema-变更)
- [5. 权限评估算法](#5-权限评估算法)
- [6. 后端变更](#6-后端变更)
- [7. 前端变更](#7-前端变更)
- [8. 审计覆盖](#8-审计覆盖)
- [9. 兼容性与迁移策略](#9-兼容性与迁移策略)
- [10. 测试要点](#10-测试要点)
- [11. 任务分解与里程碑](#11-任务分解与里程碑)
- [12. 风险与取舍](#12-风险与取舍)

---

## 1. 背景与动机

v1.0 RBAC 在现网能跑，但有三个业务痛点：

1. **角色定义靠 migration**：想把 `admin.cs` 加一个 `payment:read`，只能写 SQL、发版。真实运营需要白天就改。
2. **角色是全局的**：`admin.ops` 一旦授予就能管所有餐厅。没法表达「张三只负责南区 3 家店」。
3. **没有用户级 override**：一个 `admin.cs` 临时请假代班需要 `order:refund`，只能把他扔进 `admin.super` 或者改 role 定义污染其他同事。

Phase 4 解决这三件事，不引入新框架，不切换技术栈。

## 2. 能力差距矩阵

| 能力 | v1.0 | v2.0 目标 |
|---|---|---|
| Role 增删改查 | migration only | admin UI CRUD |
| Role 权限集编辑 | migration only | admin UI 可编辑（system role 仅改 name + 权限集） |
| 用户分配角色 | ✅ | ✅（不变） |
| 授予单个权限点给用户 | ❌ | ✅ `user_permission_grants.effect = +1` |
| 撤销单个权限点 | ❌ | ✅ `user_permission_grants.effect = -1`（DENY 优先）|
| 临时授权（到期自动失效） | ❌ | ✅ `expires_at`，评估时过滤 |
| 资源级 scope 绑定（角色仅对某些餐厅生效） | 仅 merchant 自动绑 `owner_id` | ✅ `user_role_assignments.scope` JSONB |
| 角色分配过期时间 | ❌ | ✅ `user_role_assignments.expires_at` |
| DENY 语义 | ❌ | ✅ override 支持 `-1` |
| 审计覆盖 RBAC 变更 | 部分（仅 user.role 改 persona）| ✅ role CRUD / 权限集改动 / 授权 / 撤销 / override 全覆盖 |

## 3. 范围与非范围

### In scope

- Role CRUD API（仅 `admin` persona 可管）
- Role-permission 编辑 API
- 用户级 override 表 + API
- `user_role_assignments` 加 `scope` 和 `expires_at` 两列
- Actor 计算逻辑升级（DENY 优先、过期过滤、scope 命中）
- Admin UI：System roles tab 从"只读"变为"可编辑"；Users tab 新增"Overrides"抽屉
- Audit 链路补全

### Out of scope（Phase 5+）

- ReBAC / Zanzibar / OpenFGA 接入
- OPA / 策略引擎
- 审批流（`payout:write` 要 N+1 审批）
- 冷热缓存（LRU / Redis）
- Impersonate 实现（权限点已留，实现挪后）
- 客户端实时踢下线（继续走 ≤1h refresh 生效）

## 4. 数据库 Schema 变更

### 4.1 新增字段：`user_role_assignments`

```sql
-- 000036_extend_user_role_assignments.up.sql
ALTER TABLE user_role_assignments
  ADD COLUMN scope      JSONB,
  ADD COLUMN expires_at TIMESTAMPTZ;

CREATE INDEX idx_user_role_assignments_expires_at
  ON user_role_assignments(expires_at)
  WHERE expires_at IS NOT NULL;
```

`scope` 约定为 JSONB 对象，形如：

```json
{ "restaurant_ids": [101, 102], "city_codes": ["SG-01"] }
```

- `scope IS NULL` → 全局生效（向后兼容现网所有行）
- 任意 key 缺失 → 该 scope 维度不限制
- key 为空数组 → 该 scope 维度无任何资源可操作（等价于无此角色）

`expires_at`：
- `NULL` → 永久
- 非 NULL → 评估时 `expires_at > NOW()` 才算有效

### 4.2 新增表：`user_permission_grants`

```sql
-- 000037_create_user_permission_grants.up.sql
CREATE TABLE user_permission_grants (
  user_id       BIGINT      NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  permission_id BIGINT      NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  effect        SMALLINT    NOT NULL CHECK (effect IN (1, -1)),
  scope         JSONB,
  reason        TEXT,
  granted_by    BIGINT      REFERENCES users(id),
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX idx_user_permission_grants_expires_at
  ON user_permission_grants(expires_at)
  WHERE expires_at IS NOT NULL;
```

- `effect = 1` → grant（在 role 算出的权限集之上追加）
- `effect = -1` → revoke（从 role 算出的权限集里扣除，**DENY 优先**）
- `scope`：与 role scope 同语义，NULL = 全局
- `reason`：必填业务理由（前端校验非空），落审计
- 主键 `(user_id, permission_id)` → 同一个用户同一个权限点只能有一条规则；要切 effect 就 UPSERT

### 4.3 不新建 `permissions` CUD

`permissions` 仍由 migration 管。原因：
- permission code 是后端代码里的硬编码常量，运行时加一个 code 没人 check
- 加新权限点的正确姿势：在 Go 里定义常量 → 写 migration → 发版
- admin UI 的 Permissions 页只读，保留现状

## 5. 权限评估算法

### 5.1 Actor 结构扩展

```go
// auth/actor.go
type Actor struct {
    UserID   int64
    Persona  string
    Roles    []RoleBinding     // 从 []string 升级到结构体
    Grants   []Grant           // 新增：user-level overrides
    // Permissions map 废弃，改用 CheckResource 动态计算
}

type RoleBinding struct {
    Code      string
    Scope     Scope             // nil = global
    ExpiresAt *time.Time        // nil = 永久
    PermSet   map[string]bool   // 该 role 的权限点集
}

type Grant struct {
    Perm      string
    Effect    int8              // +1 / -1
    Scope     Scope             // nil = global
    ExpiresAt *time.Time
}

type Scope struct {
    RestaurantIDs []int64
    CityCodes     []string
}
```

### 5.2 CheckResource 函数签名

```go
// auth/check.go
type Resource struct {
    RestaurantID int64  // 0 = N/A
    CityCode     string // "" = N/A
}

// Check returns true iff the actor has the permission for the given resource.
// Rules, in order:
//   1. admin.super short-circuits to true (binding must not be expired)
//   2. any un-expired Grant with effect=-1 matching (perm, resource) → false (DENY wins)
//   3. any un-expired Grant with effect=+1 matching (perm, resource) → true
//   4. any un-expired RoleBinding whose PermSet contains perm AND
//      whose Scope matches resource → true
//   5. otherwise false
func (a *Actor) CheckResource(perm string, res Resource) bool
```

Scope 匹配规则：
- `Scope == nil` → 命中任何 resource
- `Scope.RestaurantIDs != nil` 且 `res.RestaurantID == 0` → 不命中（资源未声明所属餐厅）
- `Scope.RestaurantIDs != nil` 且 `res.RestaurantID ∈ ids` → 命中
- `CityCodes` 同理

向后兼容旧 handler：保留 `actor.Can(perm)` = `CheckResource(perm, Resource{})`，行为等于「无资源上下文，仅检查全局角色」。

### 5.3 JWT Claims 升级

```go
type AccessClaims struct {
    UserID  int64           `json:"user_id"`
    Persona string          `json:"persona"`
    Roles   []RoleClaim     `json:"roles"`    // 带 scope + exp
    Grants  []GrantClaim    `json:"grants"`   // 带 effect + scope + exp
    jwt.RegisteredClaims
}

type RoleClaim struct {
    Code      string    `json:"c"`
    Scope     *Scope    `json:"s,omitempty"`
    ExpiresAt *int64    `json:"x,omitempty"` // unix sec
}

type GrantClaim struct {
    Perm      string    `json:"p"`
    Effect    int8      `json:"e"`
    Scope     *Scope    `json:"s,omitempty"`
    ExpiresAt *int64    `json:"x,omitempty"`
}
```

- 旧的 `permissions []string` 字段**保留**，由 `LoadActor` 计算「全局生效的权限集合」（scope 为 nil 且未过期的 role 的 PermSet ∪ grants），供前端快速判断按钮可见性。后端权限判断一律走 `CheckResource`。

### 5.4 Token 体积评估

现网最大 admin role 约 25 个权限点，JWT 增加 scope/exp 后预估 +20%，仍 < 1.5KB，在 HTTP header 8KB 安全线内。

## 6. 后端变更

### 6.1 新增 sqlc queries（`apps/server/db/queries/`）

`roles.sql` 追加：

```sql
-- name: CreateRole :one
-- name: UpdateRoleName :one
-- name: SoftDeleteRole :exec
-- name: PutRolePermissions :exec   -- 事务内 DELETE + 批量 INSERT
```

`user_roles.sql` 追加：

```sql
-- name: AddUserRoleWithScope :exec
-- name: UpdateUserRoleScope :exec
-- name: UpdateUserRoleExpiresAt :exec
-- name: ListUserRoleBindings :many   -- 返回 code + scope + expires_at
```

新建 `user_permission_grants.sql`：

```sql
-- name: UpsertUserGrant :exec
-- name: DeleteUserGrant :exec
-- name: ListUserGrants :many
-- name: ListUserGrantsForEval :many  -- 评估用，过滤 expires_at > NOW()
```

现有 `ListUserRoleCodes` / `ListUserPermissionCodes` 保留（前端用），内部再加 `ListUserRoleBindingsForEval`（评估用）。

### 6.2 新增 handler（`apps/server/handlers/`）

`roles.go` 扩展：

| Method | Path | 权限 | 说明 |
|---|---|---|---|
| POST | `/api/admin/roles` | `role:write` | 新建自定义 role（`is_system=FALSE`） |
| PATCH | `/api/admin/roles/{id}` | `role:write` | 改 name；system role 不允许改 code/persona |
| DELETE | `/api/admin/roles/{id}` | `role:write` | 软删；`is_system=TRUE` 禁止删；检查有无用户引用 |
| PUT | `/api/admin/roles/{id}/permissions` | `role:write` | 整体替换 role_permissions |
| PUT | `/api/admin/users/{id}/roles/{role_id}/scope` | `role:write` | 更新 `scope` + `expires_at` |

新建 `user_grants.go`：

| Method | Path | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/admin/users/{id}/grants` | `role:read` | 列出该用户所有 override |
| PUT | `/api/admin/users/{id}/grants/{perm_id}` | `role:write` | 写入 / 更新一条 grant（effect + scope + expires_at + reason） |
| DELETE | `/api/admin/users/{id}/grants/{perm_id}` | `role:write` | 删除一条 grant |

所有写操作必须：
1. 走 `middleware.RequirePermission("role:write")`
2. 走 `middleware.Audit(action)` 落审计
3. 自身保护：拒绝让当前 actor 把自己降到没有 `role:write` 的状态（沿用现有 `admin.super` 防降级思路）

### 6.3 `auth/check.go`

单独一个文件，纯函数，便于单测：

```go
package auth

func MatchesScope(scope *Scope, res Resource) bool
func (a *Actor) CheckResource(perm string, res Resource) bool
func (a *Actor) EffectivePermissions() map[string]bool  // 给前端用：全局生效的 perm 集合
```

### 6.4 `LoadActor` 升级

- 读 `user_role_assignments`（含 scope、expires_at）
- 读 `role_permissions` 批量填充每个 RoleBinding 的 PermSet（一次 IN 查询）
- 读 `user_permission_grants`（过滤 expires_at）
- 构造 Actor，返回

### 6.5 路由注册（`main.go`）

所有新路由挂到现有 `adminMux`，共享 `RequireAuth + RequireAdmin + RequirePermission("role:write") + Audit(...)` 链。

## 7. 前端变更

### 7.1 admin 新接口（`apps/admin/src/services/roles.ts`）

```ts
createRole, updateRole, deleteRole, putRolePermissions,
putUserRoleScope,
listUserGrants, putUserGrant, deleteUserGrant
```

### 7.2 页面改造

**`apps/admin/src/pages/permissions/`**

- `RolesOverview/`：System roles tab
  - 顶部增加 "New role" 按钮（自定义 role，`admin.super` 可见）
  - 每行增加 "Edit" / "Delete" 按钮（system role 的 Delete 灰掉）
  - 点 Edit → 打开现有 `RolesDrawer/`，抽屉内：
    - name 输入框（system role 可改）
    - permissions 多选（按 resource 分组的 checkbox group）
    - code / persona 对 system role 只读
- `UsersTable/`（现有）：
  - 行末新增 "Overrides" 按钮，打开 `UserGrantsDrawer/`（新组件）
  - `RolesDrawer/` 升级：每行 role 旁边加 "Scope" 和 "Expires" 编辑入口

**`UserGrantsDrawer/`（新）**

- 列表展示当前 user 所有 grant：`permission` × `effect (Grant/Revoke)` × `scope 摘要` × `expires_at` × `reason`
- "Add override" 按钮 → 弹窗：选 permission、effect、scope（可选）、expires_at（可选）、reason（必填）
- 每行支持 Edit / Delete
- reason 字段前端校验非空，tooltip 提示"该字段会写入审计日志"

### 7.3 `useCan` 不变

前端仍用 `EffectivePermissions`（从登录响应 `user.permissions` 来）做按钮可见性。**精确到餐厅/城市的判断由后端兜底**，前端不做资源级判断，避免前后端规则漂移。

### 7.4 文件组织（遵循 component-conventions）

```
apps/admin/src/pages/permissions/components/
├── RolesOverview/
│   ├── index.tsx
│   ├── hooks.ts
│   ├── type.d.ts
│   └── index.scss (若有)
├── RolesDrawer/           # 已存在，扩展
├── UserGrantsDrawer/      # 新增
│   ├── index.tsx
│   ├── hooks.ts
│   ├── utils.ts
│   ├── config.ts
│   └── type.d.ts
└── UserRoleScopeEditor/   # 新增，嵌在 RolesDrawer 内
    ├── index.tsx
    ├── hooks.ts
    └── type.d.ts
```

## 8. 审计覆盖

所有 RBAC 写操作落 `audit_logs`，`resource_type = "rbac"`，`action` 枚举：

| Action | 触发点 |
|---|---|
| `role.create` | POST /roles |
| `role.update` | PATCH /roles/{id} |
| `role.delete` | DELETE /roles/{id} |
| `role.permissions.update` | PUT /roles/{id}/permissions |
| `user_role.grant` | PUT /users/{id}/roles |
| `user_role.scope.update` | PUT /users/{id}/roles/{rid}/scope |
| `user_grant.upsert` | PUT /users/{id}/grants/{pid} |
| `user_grant.delete` | DELETE /users/{id}/grants/{pid} |

`before` / `after` 字段记录变更前后快照；`user_grant.upsert` 的 `reason` 必须冗余进 `audit_logs.metadata.reason` 便于查询。

同步更新 `docs/api/audit-logs.md`。

## 9. 兼容性与迁移策略

### 9.1 DB 层

- 所有新字段 nullable，旧行不受影响
- 现有 `user_role_assignments` 全部行 `scope=NULL, expires_at=NULL` → 行为 = v1.0 全局永久
- `user_permission_grants` 新表，空表启动

### 9.2 JWT 层

- 旧 token 在其自然过期前继续有效
- `AccessClaims.Permissions []string` 字段保留，新增 `Roles []RoleClaim` 和 `Grants []GrantClaim`
- `ParseAccessToken` 同时兼容：
  - 只有旧 `permissions` 字段 → 按 v1.0 行为，`CheckResource` 退化为全局判断
  - 有新字段 → 按 v2.0 评估
- 无需强制登出；1h 内所有在线用户自动过渡完成

### 9.3 Handler 层

- 现有 handler 调用 `actor.Can(perm)` 不改，行为等价
- 新开发的资源级接口调用 `actor.CheckResource(perm, res)`
- 推荐渐进：先合入框架，handler 按需逐步迁移

## 10. 测试要点

### 10.1 Go 单测（`auth/check_test.go`）

必覆盖用例：
- 全局 role + 无 scope resource → 通过
- scoped role + 资源在 scope → 通过
- scoped role + 资源不在 scope → 拒绝
- scoped role + 资源无标识（`RestaurantID = 0`）→ 拒绝
- grant effect=+1 与 role 并集 → 通过
- grant effect=-1 压过 role → 拒绝（DENY 优先）
- expired role binding → 不计入
- expired grant → 不计入
- `admin.super` + expired binding → 不短路
- `admin.super` + 有效 binding + 任意 revoke grant → **仍然短路通过**（super 忽略 grant；避免自锁，可讨论）
  - 备选：super 不享豁免，以便真正能撤掉超管的单个危险权限 → 最终取舍见 §12

### 10.2 集成测试（`apps/server/handlers/*_test.go`）

- role CRUD 全链路（含 system role 禁删、禁改 code）
- 自身防降级
- user grant 写入后 refresh token 生效
- 过期的 grant 在下次 refresh 后从 claims 消失

### 10.3 前端

- `UserGrantsDrawer` 的 reason 必填校验
- system role 编辑抽屉 code / persona 只读态
- `admin.super` 以外用户看不到 role CRUD 按钮

## 11. 任务分解与里程碑（已完成）

**M1 — DB + 评估器**
- [x] migration 000036 / 000037
- [x] sqlc queries（roles CUD / UpsertUserRoleBinding / ListUserRoleBindings / user_permission_grants 全套）
- [x] `auth/check.go` 纯函数 + 27 个单测（覆盖 scope 匹配 / DENY 优先 / 过期过滤 / admin.super 边界）
- [x] `auth/actor.go` 结构升级（RoleBinding / Grant / ResourceScope）
- [x] `auth/rbac.go` 重写 `LoadActor`：3 次 DB 往返（bindings / role perms / grants）
- [x] `auth/token.go` claims 升级：新增 `role_bindings` + `grants`，保留旧 `roles` / `perms` 向后兼容；`ClaimsToActor` 同时兼容新旧 token

**M2 — Backend Handlers**
- [x] `handlers/roles.go`：`CreateRole` / `UpdateRole` / `DeleteRole` / `PutRolePermissions` / `PutUserRoleScope`
- [x] `handlers/user_grants.go`：`ListUserGrants` / `PutUserGrant` / `DeleteUserGrant`
- [x] `main.go` 路由注册，全部挂 `RequirePermission("role:write") + Audit(...)`
- [x] `middleware/Audit` 覆盖 7 个 RBAC 新 action（`role.*` / `user_role.scope_update` / `user_grant.*`）
- [x] 更新 `docs/api/roles.md` / `docs/api/audit-logs.md`

**M3 — Admin UI**
- [x] `services/roles.ts` 新接口 + types
- [x] `RolesOverview` 加 CRUD 按钮 + 权限守卫（`isSuperAdmin()` 控制）
- [x] 新组件 `NewRoleModal`：创建自定义 role（前置 persona 前缀校验）
- [x] 新组件 `RoleEditDrawer`：编辑 name + 按 resource 分组的 permission checkbox
- [x] 新组件 `UserGrantsDrawer`：新增 / 编辑 / 删除 user-level override（支持 scope + 过期 + reason 必填）
- [x] `RolesDrawer` 扩展：每行 role 增加 Scope/expires 编辑入口（modal 二次确认）
- [x] 零新增依赖（不引入 dayjs，使用原生 `<input type="datetime-local">`）

**M4 — 联调 + 文档**
- [x] `make migrate-up` 已跑通；`user_role_assignments` / `user_permission_grants` schema 验证完成
- [x] `go test ./...` 全绿（auth 包 27 个 check 测试）
- [x] 本文档 Phase 4 状态标记为已落地
- [ ] （可选后续）更新 `.cursor/skills/go-server-conventions/SKILL.md`：新增「资源级 handler 必须走 `CheckResource`」硬约束 — 暂未触发，待首个真实资源级 handler 落地时补

**实际工时约 12 小时**（单人集中实现，migration + backend + UI 一次性贯通）

## 12. 风险与取舍

| 风险 | 方案 | 备注 |
|---|---|---|
| `admin.super` 是否应该被 `grant effect=-1` 覆盖 | **不被覆盖**（短路优先于 grant） | 运维语义清晰，避免「我明明是超管为什么不能点」；代价是拿掉超管个别权限只能改 role 定义 |
| JWT 变大（+20%） | 可接受（< 1.5KB） | 若未来接入更多 scope 维度再压缩 |
| 权限变更延迟仍为 1h | 沿用 v1.0 | 紧急失效走 "清空 user sessions" 兜底 |
| 自定义 role 被大量滥用导致治理难 | UI 增加 "Custom roles" 分区 + 每个自定义 role 显示创建人 + 用量 | Phase 4 先不做用量，Phase 5 补 |
| `scope.restaurant_ids` 由 admin 手填，可能输入不存在的 ID | backend 校验：所有 id 必须在 `restaurants` 表里存在且未删除 | handler 统一 validate |
| JSONB scope 查询性能 | scope 不入 WHERE，仅内存命中 | 评估在 Actor 构造后全内存完成，PG 无压力 |
| revoke 语义容易误伤 | UI 写入时展示"对比当前生效权限前后差异" | 上线前接受度评审 |
| Permission 新增仍靠 migration | 保持，本阶段不动 | 如业务真需要 UI 新增 permission，放到 Phase 5 并配套 OPA |

---

## 附录 A：典型场景示例

**场景 1**：张三是南区 ops，只管 3 家店

```
user_role_assignments:
  user_id = 42
  role_id = (admin.ops)
  scope   = {"restaurant_ids": [101, 102, 103]}
  expires_at = NULL
```

请求 `PATCH /api/merchant/restaurants/104` → CheckResource("restaurant:write", {RestaurantID: 104}) → scope 不命中 → 403

**场景 2**：CS 李四临时代班需要 refund，给 48h

```
user_permission_grants:
  user_id   = 55
  permission = order:refund
  effect    = +1
  expires_at = NOW() + 48h
  reason    = "代班王五 2026-04-19 ~ 2026-04-21"
```

48h 后 claims 里该 grant 自动不再出现，权限自然失效。

**场景 3**：某 finance 员工暂时不能看 payout（合规调查中）

```
user_permission_grants:
  user_id = 88
  permission = payout:read
  effect    = -1
  reason    = "合规冻结 CASE-2026-031"
  expires_at = NULL
```

虽然其 role `admin.finance` 包含 `payout:read`，但 DENY 优先，用户立即失去该权限（≤1h 生效）。

---

## 附录 B：不在本阶段做的事（Phase 5 shortlist）

- OPA / Rego 策略引擎（复杂条件：`order.amount > 10000 需审批`）
- ReBAC / OpenFGA（餐厅多 owner、团队协作）
- 权限变更实时推送（WebSocket 主动踢下线）
- 审批流（N+1 审批、双人复核）
- Permission 代码自动扫描（从 handler 代码提取 `RequirePermission(...)` 生成 permission 清单）
- 冷热缓存（Redis + 本地 LRU）
- 权限模拟器（输入用户 → 输出他能点的所有按钮）
