# Merchant API

对应表：`restaurants`, `orders`（通过 ABAC scope 过滤）

所有 `/api/merchant/*` 端点都需要：

- `Authorization: Bearer <access_token>`
- JWT 中 `persona = merchant`
- 响应按 **JWT 中 `scopes.restaurant_ids`** 自动过滤，绝不信任请求参数中的 `restaurant_id`

scopes 由 `auth.LoadActor` 在登录 / 刷新时一次性计算：

```sql
SELECT id FROM restaurants WHERE owner_id = <user.id> AND deleted_at IS NULL
```

后续变更（admin 把另一家店的 `owner_id` 改成该 user）**不会实时生效**，需要等 access token 过期后 refresh（最多 1h）。

## Endpoints

| Method | Path | 作用 |
|---|---|---|
| GET   | `/api/merchant/restaurants` | 列出调用方拥有的所有店 |
| GET   | `/api/merchant/restaurants/:id` | 单店详情，scope 不匹配返回 403 |
| GET   | `/api/merchant/orders?page=1&page_size=20` | 名下所有店的订单（分页） |
| PATCH | `/api/merchant/orders/:id/status` | 更新订单状态（受状态机约束，受 scope 约束） |

## GET /api/merchant/restaurants

**200**

```json
{
  "items": [
    {
      "id": 12,
      "name": "Pizzeria Bella",
      "description": "...",
      "image_url": "...",
      "address_line_1": "10 Baker St",
      "city": "London",
      "postcode": "NW1 6XE",
      "phone": "...",
      "is_open": true,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

scope 为空（刚切到 merchant persona 但还没被分配店）时返回 `{"items": []}`。

## GET /api/merchant/restaurants/:id

**200** 返回单店对象（同上结构）。

**403** `restaurant out of scope` — 不区分「店不存在」和「店存在但不归你」，避免信息泄露。

## GET /api/merchant/orders

**Query**

| 参数 | 默认 | 说明 |
|---|---|---|
| `page` | 1 | 页码 |
| `page_size` | 20 | 每页条数，最大 100 |

**200**

```json
{
  "items": [
    {
      "id": 901,
      "customer_id": 77,
      "restaurant_id": 12,
      "status": "confirmed",
      "subtotal_amount": 2400,
      "delivery_fee_amount": 300,
      "total_amount": 2700,
      "note": "no onions",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 1
}
```

scope 为空时不打 DB，直接返回 `{"items": [], ..., "total": 0}`。

## PATCH /api/merchant/orders/:id/status

**Body**

```json
{ "status": "confirmed" }
```

**允许的目标状态**：`confirmed` / `preparing` / `ready` / `cancelled`。`picked_up` / `delivered` 属于骑手侧流程，merchant 无权设置。

**状态机**（merchant 侧）：

```
pending ──→ confirmed ──→ preparing ──→ ready
   └──┬────────┴────────────┘
      └──→ cancelled
```

| 校验 | 响应 |
|---|---|
| 未登录 | `401 missing bearer token` |
| persona ≠ merchant | `403 merchant persona required` |
| scope 为空 | `403 order out of scope` |
| 订单不在自己店 | `403 order out of scope` |
| status 非合法枚举 / 不在允许列表 | `400 invalid status` |
| 非法状态迁移（如 ready → confirmed） | `400 invalid status transition` |

**200** 返回更新后的 order 对象（同 list 响应结构）。

**副作用**：写一行 `audit_logs`（`action = order.status_change`, `resource_type = order`, `resource_id = <orderId>`）。

## 运营手册：如何给一个用户开商家

1. Admin 在 `Permissions` 菜单把该用户的 persona 从 customer 改为 `merchant`
   - 触发事务：清空该用户所有 `user_role_assignments` → 授予 `merchant.default`（零权限）
2. 直连 DB 新建一行 `restaurants`，把 `owner_id` 设为该用户的 id
   - 目前无专用 API；设计上 restaurant onboarding 应走独立的运营流程
3. Admin 在 `Permissions` → `Users` → 该用户 → `Edit roles`，勾上 `merchant.owner` 并保存
4. 该用户下次登录 / 刷新 token，JWT 里即可看到：
   - `persona: "merchant"`
   - `roles: ["merchant.owner"]`
   - `perms: ["restaurant:read", "restaurant:write", "menu:read", "menu:write", "order:read", "order:cancel", "payout:read"]`
   - `scopes: { "restaurant_ids": [<id>] }`

## 已知限制

- `merchant.staff` 角色目前没有任何 user 绑定途径（无 `restaurant_staff_assignments` 表），只是占位
- scope 变更（admin 改了 `restaurants.owner_id`）最多延迟 1h 才反映在该 merchant 的 JWT 里；紧急生效需要手动清空其 `sessions` 强制重登
- `city_codes` 字段在 JWT scopes 里占位但未计算；留给后续 admin 区域经理类
