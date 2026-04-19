# Promotions API

对应表：`promotions`, `promotion_redemptions`

## Endpoints

### Public

| Method | Path | 作用 | Auth |
|---|---|---|---|
| POST | `/api/promotions/validate` | 校验优惠码是否可用 | customer |

### Admin / Merchant

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/admin/promotions` | 列表 | admin/owner |
| POST   | `/api/admin/promotions` | 新建 | admin/owner |
| GET    | `/api/admin/promotions/:id` | 详情（含累计核销） | admin/owner |
| PATCH  | `/api/admin/promotions/:id` | 更新 | admin/owner |
| POST   | `/api/admin/promotions/:id/pause` | 暂停 | admin/owner |
| POST   | `/api/admin/promotions/:id/activate` | 激活 | admin/owner |
| DELETE | `/api/admin/promotions/:id` | 软删除 | admin/owner |
| GET    | `/api/admin/promotions/:id/redemptions` | 核销明细 | admin/owner |

## Models

### Promotion

```json
{
  "id": "integer",
  "code": "WELCOME10",
  "name": "Welcome 10%",
  "description": "string | null",
  "type": "percent_off | amount_off | free_delivery | bogo",
  "status": "draft | active | paused | expired",
  "percent_off": 10,
  "amount_off": null,
  "min_order_amount": 1000,
  "max_discount_amount": 500,
  "usage_limit": 1000,
  "per_user_limit": 1,
  "redemption_count": 128,
  "starts_at": "timestamptz",
  "ends_at": "timestamptz",
  "restaurant_id": "integer | null"
}
```

### Redemption

```json
{
  "id": "integer",
  "promotion_id": "integer",
  "user_id": "integer",
  "order_id": "integer",
  "discount_amount": 100,
  "redeemed_at": "timestamptz"
}
```

## POST /api/promotions/validate

```json
{ "code": "WELCOME10", "order_subtotal_amount": 1800, "restaurant_id": "integer" }
```

**200**

```json
{
  "valid": true,
  "promotion": { ... },
  "discount_amount": 180
}
```

`400` 时返回 `{ "valid": false, "reason": "expired" | "min_order" | "usage_limit" | "per_user_limit" | "not_applicable" }`。
