# Restaurants API

对应表：`restaurants`, `restaurant_operating_hours`

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/restaurants` | 列表 / 搜索 / 地理筛选 | — |
| GET    | `/api/restaurants/:id` | 详情（含营业时间） | — |
| POST   | `/api/restaurants` | 商家创建餐厅 | owner |
| PATCH  | `/api/restaurants/:id` | 更新 | owner |
| DELETE | `/api/restaurants/:id` | 软删除 | owner |
| POST   | `/api/restaurants/:id/open` | 开启营业 | owner |
| POST   | `/api/restaurants/:id/close` | 关闭营业 | owner |
| GET    | `/api/restaurants/:id/hours` | 营业时间 | — |
| PUT    | `/api/restaurants/:id/hours` | 批量覆盖营业时间 | owner |

## Model

```json
{
  "id": "integer",
  "owner_id": "integer",
  "name": "string",
  "description": "string | null",
  "image_url": "string | null",
  "address_line_1": "string",
  "city": "string",
  "postcode": "string",
  "lat": 51.5,
  "lng": -0.12,
  "phone": "string | null",
  "is_open": true,
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### OperatingHour

```json
{
  "id": "integer",
  "restaurant_id": "integer",
  "day_of_week": 0,
  "open_time": "09:00:00",
  "close_time": "22:00:00",
  "is_closed": false
}
```

`day_of_week`: 0 = Sunday ... 6 = Saturday。

## GET /api/restaurants

**Query**

| 参数 | 类型 | 说明 |
|---|---|---|
| `q` | string | 名称模糊搜索（`trgm_restaurants_name`） |
| `city` | string | 精确城市 |
| `lat`, `lng`, `radius_km` | number | 附近搜索 |
| `is_open` | bool | 仅营业中 |
| `page`, `page_size` | int | 分页 |

**200**

```json
{
  "items": [ { ... restaurant ... } ],
  "page": 1,
  "page_size": 20,
  "total": 123
}
```

## PUT /api/restaurants/:id/hours

**Body**

```json
{
  "hours": [
    { "day_of_week": 0, "open_time": "10:00:00", "close_time": "22:00:00", "is_closed": false },
    { "day_of_week": 1, "open_time": "09:00:00", "close_time": "22:00:00", "is_closed": false }
  ]
}
```

**200** 返回完整营业时间数组。
