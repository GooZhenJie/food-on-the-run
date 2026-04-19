# FOTR API 文档

本目录是 **每张 DB 表对应一组 HTTP 接口** 的权威文档。任何数据库 schema 变更都必须同步更新这里。

## 约定

- Base URL: `http://localhost:8080`（开发）
- 前缀：所有业务接口统一 `/api/`
- 认证：除登录 / 注册 / webhook 外均需 `Authorization: Bearer <access_token>`
- Content-Type：`application/json`
- 时间戳：RFC3339，`TIMESTAMPTZ`
- 金额：`BIGINT`（最小货币单位，英镑场景为 pence），字段名 `*_amount`
- 错误：`{ "error": "<message>" }`，非 2xx 都走这个结构
- 分页：`?page=1&page_size=20`，响应结构：

```json
{
  "items": [ ... ],
  "page": 1,
  "page_size": 20,
  "total": 1234
}
```

## 资源索引

### 核心

| 资源 | 文档 | DB 表 |
|---|---|---|
| Users | [users.md](./users.md) | `users` |
| Auth | [auth.md](./auth.md) | `auth_credentials`, `sessions` |
| Roles & Permissions | [roles.md](./roles.md) | `roles`, `permissions`, `role_permissions`, `user_role_assignments` |
| Merchant | [merchant.md](./merchant.md) | `restaurants`, `orders`（scope 过滤） |
| Addresses | [addresses.md](./addresses.md) | `addresses` |
| Restaurants | [restaurants.md](./restaurants.md) | `restaurants`, `restaurant_operating_hours` |
| Menu | [menu.md](./menu.md) | `menu_categories`, `menu_items`, `menu_item_options`, `menu_item_option_values` |
| Carts | [carts.md](./carts.md) | `carts`, `cart_items` |
| Orders | [orders.md](./orders.md) | `orders`, `order_items`, `order_item_options`, `order_status_events` |
| Deliveries | [deliveries.md](./deliveries.md) | `deliveries`, `delivery_location_events` |
| Payments | [payments.md](./payments.md) | `payments`, `payment_refunds` |

### 增长

| 资源 | 文档 | DB 表 |
|---|---|---|
| Reviews | [reviews.md](./reviews.md) | `reviews` |
| Promotions | [promotions.md](./promotions.md) | `promotions`, `promotion_redemptions` |
| Notifications | [notifications.md](./notifications.md) | `notifications` |
| Favorites | [favorites.md](./favorites.md) | `favorites` |
| Rider Profiles | [rider-profiles.md](./rider-profiles.md) | `rider_profiles` |
| Restaurant Payouts | [restaurant-payouts.md](./restaurant-payouts.md) | `restaurant_payouts` |

### 运营

| 资源 | 文档 | DB 表 |
|---|---|---|
| Audit Logs | [audit-logs.md](./audit-logs.md) | `audit_logs` |
| Webhooks | [webhooks.md](./webhooks.md) | `webhook_events` |
| Feature Flags | [feature-flags.md](./feature-flags.md) | `feature_flags`, `feature_flag_overrides` |
| Page Schemas | [schemas.md](./schemas.md) | `page_schemas`, `page_schema_versions` |

## 维护规则

> 任何对 `apps/server/db/migrations/` 的新增、修改、删除，**必须** 在同一次 PR 中更新本目录下对应的 `.md` 文件。由 `postgresql-naming-conventions` skill 强制执行。
