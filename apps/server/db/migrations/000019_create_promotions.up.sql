CREATE TYPE promotion_type AS ENUM (
  'percent_off',
  'amount_off',
  'free_delivery',
  'bogo'
);

CREATE TYPE promotion_status AS ENUM (
  'draft',
  'active',
  'paused',
  'expired'
);

CREATE TABLE promotions (
  id                    BIGSERIAL PRIMARY KEY,
  code                  VARCHAR(50)      NOT NULL,
  name                  VARCHAR(150)     NOT NULL,
  description           TEXT,
  type                  promotion_type   NOT NULL,
  status                promotion_status NOT NULL DEFAULT 'draft',
  percent_off           SMALLINT,
  amount_off            BIGINT,
  min_order_amount      BIGINT           NOT NULL DEFAULT 0,
  max_discount_amount   BIGINT,
  usage_limit           INT,
  per_user_limit        INT,
  redemption_count      INT              NOT NULL DEFAULT 0,
  starts_at             TIMESTAMPTZ      NOT NULL,
  ends_at               TIMESTAMPTZ      NOT NULL,
  restaurant_id         BIGINT,
  created_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT fk_promotions_restaurants FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL,
  CONSTRAINT chk_promotions_percent    CHECK (percent_off IS NULL OR (percent_off BETWEEN 0 AND 100)),
  CONSTRAINT chk_promotions_amount     CHECK (amount_off IS NULL OR amount_off >= 0),
  CONSTRAINT chk_promotions_window     CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX uq_promotions_code
  ON promotions(code)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_promotions_status_window
  ON promotions(status, starts_at, ends_at)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_promotions_restaurant_id
  ON promotions(restaurant_id)
  WHERE deleted_at IS NULL;

CREATE TABLE promotion_redemptions (
  id              BIGSERIAL PRIMARY KEY,
  promotion_id    BIGINT        NOT NULL,
  user_id         BIGINT        NOT NULL,
  order_id        BIGINT        NOT NULL,
  discount_amount BIGINT        NOT NULL,
  redeemed_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT fk_promotion_redemptions_promotions FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  CONSTRAINT fk_promotion_redemptions_users      FOREIGN KEY (user_id)      REFERENCES users(id),
  CONSTRAINT fk_promotion_redemptions_orders     FOREIGN KEY (order_id)     REFERENCES orders(id),
  CONSTRAINT chk_promotion_redemptions_amount    CHECK (discount_amount >= 0)
);

CREATE UNIQUE INDEX uq_promotion_redemptions_order
  ON promotion_redemptions(order_id, promotion_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_promotion_redemptions_promotion_id ON promotion_redemptions(promotion_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_promotion_redemptions_user_id      ON promotion_redemptions(user_id)      WHERE deleted_at IS NULL;
