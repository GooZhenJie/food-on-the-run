CREATE TYPE payment_provider AS ENUM (
  'stripe',
  'paypal',
  'wechat_pay',
  'alipay',
  'cash'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded'
);

CREATE TABLE payments (
  id                    BIGSERIAL PRIMARY KEY,
  order_id              BIGINT           NOT NULL,
  user_id               BIGINT           NOT NULL,
  provider              payment_provider NOT NULL,
  provider_payment_id   VARCHAR(255),
  status                payment_status   NOT NULL DEFAULT 'pending',
  amount                BIGINT           NOT NULL,
  currency              CHAR(3)          NOT NULL DEFAULT 'GBP',
  failure_reason        TEXT,
  paid_at               TIMESTAMPTZ,
  meta_data             JSONB            NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT fk_payments_orders FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_payments_users  FOREIGN KEY (user_id)  REFERENCES users(id),
  CONSTRAINT chk_payments_amount CHECK (amount >= 0)
);

CREATE UNIQUE INDEX uq_payments_provider_payment_id
  ON payments(provider, provider_payment_id)
  WHERE deleted_at IS NULL AND provider_payment_id IS NOT NULL;

CREATE INDEX idx_payments_order_id   ON payments(order_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_user_id    ON payments(user_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_status     ON payments(status)     WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
