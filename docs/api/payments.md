# Payments API

对应表：`payments`, `payment_refunds`

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| POST   | `/api/orders/:order_id/payments` | 创建支付单 | customer |
| GET    | `/api/payments/:id` | 支付详情 | customer/admin |
| POST   | `/api/payments/:id/cancel` | 取消未完成支付 | customer |
| POST   | `/api/payments/:id/refunds` | 发起退款 | admin/owner |
| GET    | `/api/payments/:id/refunds` | 退款列表 | customer/admin |
| POST   | `/api/webhooks/payments/:provider` | 支付网关回调 | signature |

## Models

### Payment

```json
{
  "id": "integer",
  "order_id": "integer",
  "user_id": "integer",
  "provider": "stripe | paypal | wechat_pay | alipay | cash",
  "provider_payment_id": "string | null",
  "status": "pending | processing | succeeded | failed | cancelled | refunded | partially_refunded",
  "amount": 2097,
  "currency": "GBP",
  "failure_reason": "string | null",
  "paid_at": "timestamptz | null",
  "created_at": "timestamptz"
}
```

### Refund

```json
{
  "id": "integer",
  "payment_id": "integer",
  "provider_refund_id": "string | null",
  "status": "pending | processing | succeeded | failed | cancelled",
  "amount": 500,
  "reason": "string | null",
  "refunded_at": "timestamptz | null",
  "created_at": "timestamptz"
}
```

## POST /api/orders/:order_id/payments

```json
{ "provider": "stripe" }
```

**201**

```json
{
  "payment": { ... },
  "client_secret": "pi_xxx_secret_xxx"
}
```

## POST /api/payments/:id/refunds

```json
{ "amount": 500, "reason": "missing_item" }
```

**201** 返回 refund 对象；实际状态流转由 `/api/webhooks/payments/:provider` 异步推进。

## POST /api/webhooks/payments/:provider

**Headers** 必须包含服务商签名（如 `Stripe-Signature`）。请求先写入 `webhook_events` 表做幂等，再驱动 payment/refund 状态变更。

**200 / 204** 表示已接收，业务处理错误也要返回 2xx 以避免服务商无限重试。
