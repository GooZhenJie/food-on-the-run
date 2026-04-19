CREATE TYPE review_target_type AS ENUM (
  'restaurant',
  'rider',
  'menu_item'
);

CREATE TABLE reviews (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT              NOT NULL,
  author_id       BIGINT              NOT NULL,
  target_type     review_target_type  NOT NULL,
  target_id       BIGINT              NOT NULL,
  rating          SMALLINT            NOT NULL,
  comment         TEXT,
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT fk_reviews_orders  FOREIGN KEY (order_id)  REFERENCES orders(id),
  CONSTRAINT fk_reviews_author  FOREIGN KEY (author_id) REFERENCES users(id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX uq_reviews_order_author_target
  ON reviews(order_id, author_id, target_type, target_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_reviews_target
  ON reviews(target_type, target_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_reviews_author_id
  ON reviews(author_id)
  WHERE deleted_at IS NULL;
