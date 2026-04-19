# Menu API

对应表：`menu_categories`, `menu_items`, `menu_item_options`, `menu_item_option_values`

## Endpoints

### Categories

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/restaurants/:restaurant_id/menu/categories` | 分类列表 | — |
| POST   | `/api/restaurants/:restaurant_id/menu/categories` | 新建分类 | owner |
| PATCH  | `/api/menu/categories/:id` | 更新 | owner |
| DELETE | `/api/menu/categories/:id` | 软删除 | owner |

### Items

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/restaurants/:restaurant_id/menu/items` | 菜品列表（按分类分组） | — |
| GET    | `/api/menu/items/:id` | 菜品详情（含 options） | — |
| POST   | `/api/restaurants/:restaurant_id/menu/items` | 新建菜品 | owner |
| PATCH  | `/api/menu/items/:id` | 更新 | owner |
| DELETE | `/api/menu/items/:id` | 软删除 | owner |
| POST   | `/api/menu/items/:id/availability` | 切换上下架 | owner |

### Item Options

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/menu/items/:item_id/options` | option 列表（含 values） | — |
| POST   | `/api/menu/items/:item_id/options` | 新建 option | owner |
| PATCH  | `/api/menu/options/:id` | 更新 option | owner |
| DELETE | `/api/menu/options/:id` | 软删除 option | owner |
| POST   | `/api/menu/options/:id/values` | 新建 value | owner |
| PATCH  | `/api/menu/option-values/:id` | 更新 value | owner |
| DELETE | `/api/menu/option-values/:id` | 软删除 value | owner |

## Models

### Category

```json
{
  "id": "integer",
  "restaurant_id": "integer",
  "name": "string",
  "sort_order": 0
}
```

### Item

```json
{
  "id": "integer",
  "restaurant_id": "integer",
  "category_id": "integer | null",
  "name": "string",
  "description": "string | null",
  "image_url": "string | null",
  "price_amount": 899,
  "is_available": true,
  "options": [ { ...option } ]
}
```

### Option

```json
{
  "id": "integer",
  "menu_item_id": "integer",
  "name": "Size",
  "is_required": true,
  "min_select": 1,
  "max_select": 1,
  "sort_order": 0,
  "values": [ { ...value } ]
}
```

### Option Value

```json
{
  "id": "integer",
  "option_id": "integer",
  "name": "Large",
  "price_amount": 100,
  "sort_order": 0,
  "is_default": false,
  "is_available": true
}
```
