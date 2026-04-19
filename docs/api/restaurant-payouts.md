# Restaurant Payouts API

对应表：`restaurant_payouts`

## Endpoints

### Merchant

| Method | Path | 作用 | Auth |
|---|---|---|---|
| GET | `/api/restaurants/:restaurant_id/payouts` | 结算单列表 | owner |
| GET | `/api/payouts/:id` | 结算详情 | owner/admin |

### Admin

| Method | Path | 作用 | Auth |
|---|---|---|---|
| POST | `/api/admin/payouts` | 手动生成一期结算 | admin |
| POST | `/api/admin/payouts/:id/pay` | 标记已付款 | admin |
| POST | `/api/admin/payouts/:id/fail` | 标记失败 | admin |
| POST | `/api/admin/payouts/:id/cancel` | 取消 | admin |

## Model

```json
{
  "id": "integer",
  "restaurant_id": "integer",
  "period_start_date": "2026-04-01",
  "period_end_date": "2026-04-07",
  "gross_amount": 125000,
  "platform_fee_amount": 18750,
  "adjustment_amount": 0,
  "net_amount": 106250,
  "currency": "GBP",
  "status": "pending | processing | paid | failed | cancelled",
  "paid_at": "timestamptz | null",
  "reference": "string | null",
  "created_at": "timestamptz"
}
```

## POST /api/admin/payouts

```json
{
  "restaurant_id": "integer",
  "period_start_date": "2026-04-01",
  "period_end_date": "2026-04-07"
}
```

**201** 返回 payout 对象。服务端计算：
- `gross_amount` = 区间内 `delivered` 订单 `total_amount` 之和（扣除退款）
- `platform_fee_amount` = 按平台费率配置计算
- `net_amount` = `gross_amount - platform_fee_amount + adjustment_amount`

## POST /api/admin/payouts/:id/pay

```json
{ "reference": "bank-ref-xxx" }
```

**200**。状态 `pending|processing → paid`，写 `paid_at`。
