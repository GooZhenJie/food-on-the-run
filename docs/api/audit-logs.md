# Audit Logs API

对应表：`audit_logs`

**只读** 系统审计流水。由 `middleware.Audit` 在每次敏感操作成功（2xx）后异步写入，不对外暴露写接口。

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET | `/api/admin/audit-logs` | 列表 / 过滤（未实现） | admin |
| GET | `/api/admin/audit-logs/:id` | 详情（未实现） | admin |

> Phase 3 只做中间件 + 落表，查询接口暂未实现；运营侧直接 `psql` 查表即可。

## 已纳入审计的 action

| Action | Resource type | 端点 | 触发条件 |
|---|---|---|---|
| `user.persona_change` | `user` | `PATCH /api/admin/users/:id/role` | 2xx 响应 |
| `user.roles_replace` | `user` | `PUT /api/admin/users/:id/roles` | 2xx 响应 |
| `schema.publish` | `page_schema` | `POST /api/admin/schemas/publish` | 2xx 响应 |
| `schema.delete` | `page_schema` | `DELETE /api/admin/schemas?key=` | 2xx 响应 |
| `order.status_change` | `order` | `PATCH /api/merchant/orders/:id/status` | 2xx 响应 |
| `role.create` | `rbac` | `POST /api/admin/roles` | 2xx 响应 |
| `role.update` | `rbac` | `PATCH /api/admin/roles/:id` | 2xx 响应 |
| `role.delete` | `rbac` | `DELETE /api/admin/roles/:id` | 2xx 响应 |
| `role.permissions_update` | `rbac` | `PUT /api/admin/roles/:id/permissions` | 2xx 响应 |
| `user_role.scope_update` | `rbac` | `PUT /api/admin/users/:id/roles/:role_id/scope` | 2xx 响应 |
| `user_grant.upsert` | `rbac` | `PUT /api/admin/users/:id/grants/:permission_id` | 2xx 响应 |
| `user_grant.delete` | `rbac` | `DELETE /api/admin/users/:id/grants/:permission_id` | 2xx 响应 |

写入行为：
- **异步** — handler 响应不会被审计写库阻塞，写失败只打 error log，不影响主流程
- 非 2xx 不落审计（失败操作已在应用日志里）
- `actor_id` / `actor_role` 来自 JWT 中的 Actor；未登录请求（理论上不会触及）落 NULL
- `resource_id` 通过 `middleware.PathValueID("id")` 提取，DELETE by query param 场景用 `middleware.NoResourceID` 显式留 NULL

## Model

```json
{
  "id": "integer",
  "actor_id": "integer | null",
  "actor_role": "customer | rider | merchant | admin | null",
  "action": "user.persona_change | user.roles_replace | schema.publish | schema.delete | order.status_change | ...",
  "resource_type": "order | user | page_schema | ...",
  "resource_id": "integer | null",
  "ip_address": "string | null",
  "user_agent": "string | null",
  "meta_data": { "before": { ... }, "after": { ... } },
  "created_at": "timestamptz"
}
```

## GET /api/admin/audit-logs

**Query**

| 参数 | 说明 |
|---|---|
| `actor_id` | 按操作者过滤 |
| `action` | 按动作过滤（支持前缀，如 `order.`） |
| `resource_type` | 按资源类型 |
| `resource_id` | 按具体资源 |
| `from`, `to` | 时间范围（RFC3339） |
| `page`, `page_size` | 分页 |

**200**

```json
{
  "items": [ { ...log } ],
  "page": 1,
  "page_size": 20,
  "total": 12345
}
```
