CREATE TYPE refund_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled'
);

CREATE TABLE payment_refunds (
  id                   BIGSERIAL PRIMARY KEY,
  payment_id           BIGINT         NOT NULL,
  provider_refund_id   VARCHAR(255),
  status               refund_status  NOT NULL DEFAULT 'pending',
  amount               BIGINT         NOT NULL,
  reason               TEXT,
  refunded_at          TIMESTAMPTZ,
  meta_data            JSONB          NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,

  CONSTRAINT fk_payment_refunds_payments FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT chk_payment_refunds_amount  CHECK (amount >= 0)
);

CREATE UNIQUE INDEX uq_payment_refunds_provider_refund_id
  ON payment_refunds(provider_refund_id)
  WHERE deleted_at IS NULL AND provider_refund_id IS NOT NULL;

CREATE INDEX idx_payment_refunds_payment_id ON payment_refunds(payment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_refunds_status     ON payment_refunds(status)     WHERE deleted_at IS NULL;
