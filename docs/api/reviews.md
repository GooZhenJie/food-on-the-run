# Reviews API

对应表：`reviews`

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| POST   | `/api/orders/:order_id/reviews` | 提交一条评价（restaurant / rider / menu_item 其中之一） | customer |
| GET    | `/api/restaurants/:id/reviews` | 餐厅评价列表 | — |
| GET    | `/api/riders/:id/reviews` | 骑手评价列表 | — |
| GET    | `/api/menu/items/:id/reviews` | 菜品评价列表 | — |
| PATCH  | `/api/reviews/:id` | 修改我的评价 | author |
| DELETE | `/api/reviews/:id` | 软删除我的评价 | author |

## Model

```json
{
  "id": "integer",
  "order_id": "integer",
  "author_id": "integer",
  "target_type": "restaurant | rider | menu_item",
  "target_id": "integer",
  "rating": 5,
  "comment": "string | null",
  "created_at": "timestamptz"
}
```

## POST /api/orders/:order_id/reviews

```json
{
  "target_type": "restaurant",
  "target_id": "integer",
  "rating": 5,
  "comment": "great!"
}
```

**201** 返回 review 对象。服务端校验：
- 订单已 `delivered`
- `author_id = current_user.id`
- 每 `(order_id, author_id, target_type, target_id)` 唯一，再次提交返回 `409`

## GET /api/restaurants/:id/reviews

**Query**: `?rating=5&page=1&page_size=20`

**200**

```json
{
  "summary": { "rating_average": 4.6, "rating_count": 128 },
  "items": [ { ...review, "author": { "name": "..." } } ],
  "page": 1,
  "page_size": 20,
  "total": 128
}
```
