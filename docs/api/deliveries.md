# Deliveries API

对应表：`deliveries`, `delivery_location_events`

## Endpoints

### Customer

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET | `/api/orders/:order_id/delivery` | 订单配送状态 + 最新骑手位置 | customer |

### Rider

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/rider/deliveries/available` | 可接单列表 | rider |
| POST   | `/api/deliveries/:id/accept` | 接单 | rider |
| POST   | `/api/deliveries/:id/pickup` | 已取餐 | rider |
| POST   | `/api/deliveries/:id/deliver` | 已送达 | rider |
| POST   | `/api/deliveries/:id/locations` | 上报位置 | rider |
| GET    | `/api/deliveries/:id/locations` | 轨迹查询 | customer/rider/admin |

### Admin

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET  | `/api/admin/deliveries` | 全局配送列表 | admin |
| POST | `/api/admin/deliveries/:id/assign` | 强制指派骑手 | admin |

## Model

```json
{
  "id": "integer",
  "order_id": "integer",
  "rider_id": "integer | null",
  "status": "unassigned | assigned | picked_up | delivered",
  "picked_up_at": "timestamptz | null",
  "delivered_at": "timestamptz | null",
  "rider": { "id": "...", "name": "...", "phone": "..." } | null,
  "latest_location": {
    "lat": 51.5,
    "lng": -0.12,
    "recorded_at": "timestamptz"
  } | null
}
```

## POST /api/deliveries/:id/locations

**Body**

```json
{
  "lat": 51.5074,
  "lng": -0.1278,
  "accuracy_meters": 5.0,
  "heading_degrees": 180.0,
  "speed_mps": 4.1,
  "recorded_at": "2026-04-18T12:00:00Z"
}
```

**支持批量上报**：

```json
{ "points": [ { ...point }, { ...point } ] }
```

**204**。同步更新 `rider_profiles.current_lat / current_lng / location_updated_at`。

## GET /api/deliveries/:id/locations

**Query**: `?since=<timestamptz>&limit=200`

**200**

```json
{ "items": [ { ...point } ] }
```
