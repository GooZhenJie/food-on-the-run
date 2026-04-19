# Favorites API

对应表：`favorites`

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/favorites` | 我的收藏列表 | ✓ |
| POST   | `/api/favorites` | 添加收藏 | ✓ |
| DELETE | `/api/favorites` | 取消收藏（按 target） | ✓ |

## Model

```json
{
  "id": "integer",
  "user_id": "integer",
  "target_type": "restaurant | menu_item",
  "target_id": "integer",
  "created_at": "timestamptz"
}
```

## GET /api/favorites

**Query**: `?target_type=restaurant&page=1&page_size=20`

**200**

```json
{
  "items": [
    {
      "id": "integer",
      "target_type": "restaurant",
      "target": { ...restaurant 或 menu_item 详情... },
      "created_at": "..."
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 15
}
```

## POST /api/favorites

```json
{ "target_type": "restaurant", "target_id": "integer" }
```

**201** 返回 favorite 对象。重复收藏返回 `409` 或幂等返回已有记录。

## DELETE /api/favorites

**Query**: `?target_type=restaurant&target_id=integer`

**204**。软删除：设置 `deleted_at`。
