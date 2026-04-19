# Notifications API

对应表：`notifications`

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET    | `/api/notifications` | 我的消息列表 | ✓ |
| GET    | `/api/notifications/unread-count` | 未读数 | ✓ |
| POST   | `/api/notifications/:id/read` | 标记已读 | ✓ |
| POST   | `/api/notifications/read-all` | 全部已读 | ✓ |
| DELETE | `/api/notifications/:id` | 软删除 | ✓ |

## Model

```json
{
  "id": "integer",
  "user_id": "integer",
  "channel": "in_app | email | sms | push",
  "type": "order_update | delivery_update | promotion | system | review_request",
  "title": "string",
  "body": "string",
  "meta_data": { "order_id": "...", "deep_link": "..." },
  "read_at": "timestamptz | null",
  "sent_at": "timestamptz | null",
  "created_at": "timestamptz"
}
```

## GET /api/notifications

**Query**: `?unread=true&type=order_update&page=1&page_size=20`

**200**

```json
{
  "items": [ { ...notification } ],
  "page": 1,
  "page_size": 20,
  "total": 42,
  "unread_count": 7
}
```

## GET /api/notifications/unread-count

**200**

```json
{ "count": 7 }
```
