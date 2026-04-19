# Carts API

对应表：`carts`, `cart_items`

每个用户 **最多一个活跃购物车**。切换餐厅时，旧车内容被清空（或提示用户确认）。

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/cart` | 获取我的购物车 | ✓ |
| DELETE | `/api/cart` | 清空购物车 | ✓ |
| POST   | `/api/cart/items` | 添加商品 | ✓ |
| PATCH  | `/api/cart/items/:id` | 修改数量 / 备注 | ✓ |
| DELETE | `/api/cart/items/:id` | 移除商品 | ✓ |

## Model

```json
{
  "id": "integer",
  "user_id": "integer",
  "restaurant_id": "integer | null",
  "items": [
    {
      "id": "integer",
      "menu_item_id": "integer",
      "name": "string",
      "price_amount": 899,
      "quantity": 2,
      "note": "string | null",
      "subtotal_amount": 1798
    }
  ],
  "subtotal_amount": 1798
}
```

## POST /api/cart/items

```json
{
  "menu_item_id": "integer",
  "quantity": 1,
  "note": "no onion"
}
```

**200** 返回完整购物车对象。若新菜品的 `restaurant_id` 与现有 cart 不同，返回 `409 conflict`：

```json
{ "error": "cart_restaurant_conflict", "current_restaurant_id": "..." }
```

客户端应提示是否清空旧购物车后重试。
