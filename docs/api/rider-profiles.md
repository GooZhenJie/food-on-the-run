# Rider Profiles API

对应表：`rider_profiles`

## Endpoints

### Rider

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/rider/profile` | 我的骑手资料 | rider |
| PATCH  | `/api/rider/profile` | 更新资料 | rider |
| POST   | `/api/rider/online` | 上线 | rider |
| POST   | `/api/rider/offline` | 下线 | rider |
| POST   | `/api/rider/location` | 上报当前位置 | rider |

### Admin

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/admin/riders` | 骑手列表 | admin |
| POST   | `/api/admin/riders/:id/verify` | 审核通过 | admin |

## Model

```json
{
  "id": "integer",
  "user_id": "integer",
  "vehicle_type": "bicycle | e_bike | scooter | motorbike | car",
  "vehicle_plate": "string | null",
  "license_number": "string | null",
  "license_expires_at": "timestamptz | null",
  "is_verified": false,
  "online_status": "offline | online | on_delivery",
  "current_lat": 51.5,
  "current_lng": -0.12,
  "location_updated_at": "timestamptz | null",
  "rating_average": 4.8,
  "rating_count": 320,
  "completed_deliveries": 415
}
```

## POST /api/rider/location

```json
{ "lat": 51.5074, "lng": -0.1278 }
```

**204**。同时：
- 更新 `rider_profiles.current_lat / current_lng / location_updated_at`
- 若当前正在配送中，追加 `delivery_location_events` 一条记录

## GET /api/admin/riders

**Query**: `?online_status=online&is_verified=true&page=1&page_size=20`
