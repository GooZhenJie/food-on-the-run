# Webhooks API

对应表：`webhook_events`

## Endpoints

### Inbound（第三方推给我们）

| Method | Path | 作用 | Auth |
|---|---|---|---|
| POST | `/api/webhooks/payments/stripe` | Stripe 回调 | signature |
| POST | `/api/webhooks/payments/paypal` | PayPal 回调 | signature |
| POST | `/api/webhooks/payments/:provider` | 其他支付服务商 | signature |

### Admin 观察 / 重放

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET  | `/api/admin/webhook-events` | 事件列表（过滤） | admin |
| GET  | `/api/admin/webhook-events/:id` | 事件详情（含 payload） | admin |
| POST | `/api/admin/webhook-events/:id/retry` | 手动重放 | admin |

## Model

```json
{
  "id": "integer",
  "provider": "stripe",
  "event_type": "payment_intent.succeeded",
  "provider_event_id": "evt_xxx",
  "status": "received | processing | succeeded | failed | skipped",
  "payload_data": { ... },
  "signature": "string | null",
  "error_message": "string | null",
  "retry_count": 0,
  "processed_at": "timestamptz | null",
  "received_at": "timestamptz",
  "created_at": "timestamptz"
}
```

## POST /api/webhooks/payments/:provider

**Request** 原样转发服务商 payload。服务端：
1. 校验签名，失败 → `401`
2. 按 `(provider, provider_event_id)` 做幂等；命中则直接 `200 { "status": "skipped" }`
3. 写入 `webhook_events(status='received')`
4. 异步/同步推进对应 payment / refund 状态机，完成后更新 `processed_at` 和 `status`

**任何业务失败也要返回 2xx**（写入 `status='failed'` + `error_message`），避免服务商无限重试。

## POST /api/admin/webhook-events/:id/retry

**200**。重跑处理逻辑，累加 `retry_count`。
