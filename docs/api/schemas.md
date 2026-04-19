# Page Schemas API

对应表：`page_schemas`, `page_schema_versions`

承载 config-driven 前端渲染所需的页面 schema。`page_schemas` 保存每个 `key`（路由路径，如 `/home`）当前发布的 schema；`page_schema_versions` 保存每次上传的历史版本，用于前后版本对比与审计。

## Endpoints

### Client

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET | `/api/public/schemas?key=/home` | 获取指定 key 的当前发布 schema | 无 |

### Admin

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET  | `/api/admin/schemas`                              | 列出全部 schema 当前版本 | admin |
| GET  | `/api/admin/schemas?key=/home`                    | 获取单个 schema 当前版本 | admin |
| GET  | `/api/admin/schemas/versions?key=/home`           | 列出指定 key 的所有历史版本（最新在前） | admin |
| GET  | `/api/admin/schemas/versions?key=/home&version=3` | 获取指定 key 的某个版本（用于 diff） | admin |
| POST | `/api/admin/schemas/publish`                      | 发布新版本，返回新旧版本以便 diff | admin |

## Models

### PageSchema

```json
{
  "id": 1,
  "key": "/home",
  "current_version": 3,
  "schema_data": { "type": "PageWrapper", "children": [] },
  "created_at": "timestamptz",
  "updated_at": "timestamptz"
}
```

### PageSchemaVersion

```json
{
  "id": 12,
  "page_schema_id": 1,
  "version": 3,
  "schema_data": { "type": "PageWrapper", "children": [] },
  "note": "调整 hero banner 文案",
  "creator_id": 42,
  "created_at": "timestamptz"
}
```

## GET /api/public/schemas

**Query**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `key` | string | ✓ | 路由路径，必须以 `/` 开头，如 `/home` |

**200** — 返回 `PageSchema`。
**404** — schema 不存在。

## GET /api/admin/schemas

**Query**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `key` | string | 否 | 传入则返回单个 `PageSchema`，否则返回列表 |

**200（列表）**

```json
{
  "items": [ { "id": 1, "key": "/home", "current_version": 3, "schema_data": {...}, "created_at": "...", "updated_at": "..." } ]
}
```

**200（单个）** — 返回 `PageSchema`。

## GET /api/admin/schemas/versions

**Query**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `key` | string | ✓ | 路由路径 |
| `version` | int | 否 | 指定则返回单个版本，否则返回该 key 全部版本列表 |

**200（列表）**

```json
{
  "items": [ { "id": 12, "page_schema_id": 1, "version": 3, "schema_data": {...}, "note": "...", "creator_id": 42, "created_at": "..." } ]
}
```

**200（单个）** — 返回 `PageSchemaVersion`。

**404** — key 不存在 / 指定 version 不存在。

## POST /api/admin/schemas/publish

发布一次新版本。服务端在单事务中：

1. 若 `key` 不存在，新建 `page_schemas` 行，`version = 1`
2. 否则 `page_schemas.current_version += 1`，`schema_data` 覆盖为新内容
3. 追加一行 `page_schema_versions`（`version` 与 `current_version` 一致）

**Request**

```json
{
  "key": "/home",
  "schema_data": { "type": "PageWrapper", "children": [] },
  "note": "调整 hero banner 文案"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `key` | string | ✓ | 路由路径，必须以 `/` 开头 |
| `schema_data` | object | ✓ | 任意合法 JSON 对象，存入 JSONB |
| `note` | string | 否 | 本次变更备注 |

**201**

```json
{
  "schema":           { "id": 1, "key": "/home", "current_version": 3, "schema_data": {...}, "created_at": "...", "updated_at": "..." },
  "new_version":      { "id": 12, "page_schema_id": 1, "version": 3, "schema_data": {...}, "note": "...", "creator_id": 42, "created_at": "..." },
  "previous_version": { "id": 11, "page_schema_id": 1, "version": 2, "schema_data": {...}, "note": "...", "creator_id": 42, "created_at": "..." }
}
```

- `previous_version` 仅在存在上一版本时返回，首次发布时省略
- 前端可直接用 `new_version.schema_data` 与 `previous_version.schema_data` 做 diff 展示

**400** — `key` 为空 / 不以 `/` 开头、`schema_data` 不是合法 JSON。
**401** — 无 / 无效的 bearer token。
**403** — 非 admin 角色。
