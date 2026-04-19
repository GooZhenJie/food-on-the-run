# Audit Logs API

对应表：`audit_logs`

**只读** 系统审计流水。由服务端在每次敏感操作后写入（不对外暴露写接口）。

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET | `/api/admin/audit-logs` | 列表 / 过滤 | admin |
| GET | `/api/admin/audit-logs/:id` | 详情 | admin |

## Model

```json
{
  "id": "integer",
  "actor_id": "integer | null",
  "actor_role": "customer | rider | admin | null",
  "action": "user.login | order.cancel | menu.update | ...",
  "resource_type": "order | user | menu_item | ...",
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
