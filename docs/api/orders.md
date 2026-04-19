# Orders API

对应表：`orders`, `order_items`, `order_item_options`, `order_status_events`

## Endpoints

### Customer

| Method | Path | 作用 | Auth |
|---|---|---|---|
| POST   | `/api/orders` | 下单（从 cart 生成） | customer |
| GET    | `/api/orders` | 我的订单列表 | customer |
| GET    | `/api/orders/:id` | 订单详情 | customer/owner/rider |
| POST   | `/api/orders/:id/cancel` | 取消订单 | customer |
| GET    | `/api/orders/:id/events` | 订单状态时间线 | customer/owner/rider |

### Merchant

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/restaurants/:restaurant_id/orders` | 商家订单列表 | owner |
| POST   | `/api/orders/:id/confirm` | 商家确认接单 | owner |
| POST   | `/api/orders/:id/prepare` | 标记制作中 | owner |
| POST   | `/api/orders/:id/ready` | 标记已出餐 | owner |

## Model

```json
{
  "id": "integer",
  "customer_id": "integer",
  "restaurant_id": "integer",
  "address_id": "integer | null",
  "status": "pending | confirmed | preparing | ready | picked_up | delivered | cancelled",
  "subtotal_amount": 1798,
  "delivery_fee_amount": 299,
  "total_amount": 2097,
  "note": "string | null",
  "created_at": "timestamptz",
  "items": [
    {
      "id": "integer",
      "menu_item_id": "integer",
      "name": "Margherita",
      "price_amount": 899,
      "quantity": 2,
      "options": [
        {
          "option_name": "Size",
          "option_value_name": "Large",
          "price_amount": 100
        }
      ]
    }
  ]
}
```

### Status Event

```json
{
  "id": "integer",
  "order_id": "integer",
  "from_status": "pending | null",
  "to_status": "confirmed",
  "changed_by_id": "integer | null",
  "reason": "string | null",
  "created_at": "timestamptz"
}
```

## POST /api/orders

```json
{
  "address_id": "integer",
  "note": "leave at door",
  "promotion_code": "WELCOME10"
}
```

服务端从当前 cart 生成 order + order_items + order_item_options（快照），并写一条 `order_status_events(to_status='pending')`。

**201** 返回订单对象 + 支付初始化信息：

```json
{
  "order": { ... },
  "payment": { "id": "integer", "client_secret": "..." }
}
```

## POST /api/orders/:id/cancel

```json
{ "reason": "changed_mind" }
```

**200** 返回更新后的订单；追加 `order_status_events(to_status='cancelled')`；若已支付则异步触发退款。
