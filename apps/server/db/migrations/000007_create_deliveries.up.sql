CREATE TABLE deliveries (
  id            BIGSERIAL         PRIMARY KEY,
  order_id      BIGINT            NOT NULL,
  rider_id      BIGINT,
  status        delivery_status   NOT NULL DEFAULT 'unassigned',
  picked_up_at  TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,

  CONSTRAINT fk_deliveries_orders    FOREIGN KEY (order_id)  REFERENCES orders(id),
  CONSTRAINT fk_deliveries_rider     FOREIGN KEY (rider_id)  REFERENCES users(id)
);

CREATE UNIQUE INDEX uq_deliveries_order_id ON deliveries(order_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_deliveries_rider_id ON deliveries(rider_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deliveries_status   ON deliveries(status)   WHERE deleted_at IS NULL;
