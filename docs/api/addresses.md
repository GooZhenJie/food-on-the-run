# Addresses API

对应表：`addresses`

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/addresses` | 当前用户地址列表 | ✓ |
| POST   | `/api/addresses` | 新建地址 | ✓ |
| GET    | `/api/addresses/:id` | 地址详情 | ✓ |
| PATCH  | `/api/addresses/:id` | 更新地址 | ✓ |
| DELETE | `/api/addresses/:id` | 软删除 | ✓ |
| POST   | `/api/addresses/:id/default` | 设为默认地址 | ✓ |

## Model

```json
{
  "id": "integer",
  "user_id": "integer",
  "label": "string | null",
  "address_line_1": "string",
  "address_line_2": "string | null",
  "city": "string",
  "postcode": "string",
  "lat": 51.5074,
  "lng": -0.1278,
  "is_default": false,
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

## POST /api/addresses

```json
{
  "label": "Home",
  "address_line_1": "...",
  "address_line_2": "...",
  "city": "London",
  "postcode": "SW1A 1AA",
  "lat": 51.5074,
  "lng": -0.1278,
  "is_default": true
}
```

**201** 返回完整地址对象。

## POST /api/addresses/:id/default

**204**。事务内：把该用户其他地址的 `is_default` 置 false，把当前设为 true。
