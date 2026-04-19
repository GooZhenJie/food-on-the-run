# Feature Flags API

对应表：`feature_flags`, `feature_flag_overrides`

## Endpoints

### Client

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET | `/api/feature-flags` | 当前用户可见的 flags 快照 | ✓ |

### Admin

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/admin/feature-flags` | 全量列表 | admin |
| POST   | `/api/admin/feature-flags` | 新建 | admin |
| GET    | `/api/admin/feature-flags/:id` | 详情 | admin |
| PATCH  | `/api/admin/feature-flags/:id` | 更新（含开关、灰度百分比、config） | admin |
| DELETE | `/api/admin/feature-flags/:id` | 软删除 | admin |
| POST   | `/api/admin/feature-flags/:id/overrides` | 为指定用户强制开/关 | admin |
| DELETE | `/api/admin/feature-flags/:id/overrides/:user_id` | 移除用户覆盖 | admin |

## Models

### FeatureFlag

```json
{
  "id": "integer",
  "key": "new_checkout_ui",
  "description": "string | null",
  "is_enabled": true,
  "rollout_percent": 20,
  "config": { "variant": "A" },
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### Override

```json
{
  "id": "integer",
  "feature_flag_id": "integer",
  "user_id": "integer",
  "is_enabled": true
}
```

## GET /api/feature-flags

**200**

```json
{
  "flags": {
    "new_checkout_ui": { "is_enabled": true, "config": { "variant": "A" } },
    "promo_banner":    { "is_enabled": false, "config": {} }
  }
}
```

判定逻辑：
1. 若用户存在 override → 使用 override 值
2. 否则若 `is_enabled = false` → `false`
3. 否则按 `rollout_percent` + `hash(user_id, key)` 做稳定灰度分桶

## POST /api/admin/feature-flags/:id/overrides

```json
{ "user_id": "integer", "is_enabled": true }
```

**201** 返回 override 对象。
