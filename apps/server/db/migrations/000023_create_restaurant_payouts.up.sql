CREATE TYPE payout_status AS ENUM (
  'pending',
  'processing',
  'paid',
  'failed',
  'cancelled'
);

CREATE TABLE restaurant_payouts (
  id                    BIGSERIAL PRIMARY KEY,
  restaurant_id         BIGINT        NOT NULL,
  period_start_date     DATE          NOT NULL,
  period_end_date       DATE          NOT NULL,
  gross_amount          BIGINT        NOT NULL,
  platform_fee_amount   BIGINT        NOT NULL DEFAULT 0,
  adjustment_amount     BIGINT        NOT NULL DEFAULT 0,
  net_amount            BIGINT        NOT NULL,
  currency              CHAR(3)       NOT NULL DEFAULT 'GBP',
  status                payout_status NOT NULL DEFAULT 'pending',
  paid_at               TIMESTAMPTZ,
  reference             VARCHAR(100),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT fk_restaurant_payouts_restaurants
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT chk_restaurant_payouts_window
    CHECK (period_end_date >= period_start_date),
  CONSTRAINT chk_restaurant_payouts_amounts
    CHECK (gross_amount >= 0 AND platform_fee_amount >= 0)
);

CREATE UNIQUE INDEX uq_restaurant_payouts_period
  ON restaurant_payouts(restaurant_id, period_start_date, period_end_date)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_restaurant_payouts_status
  ON restaurant_payouts(status)
  WHERE deleted_at IS NULL;
