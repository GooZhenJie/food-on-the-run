CREATE TABLE order_status_events (
  id             BIGSERIAL PRIMARY KEY,
  order_id       BIGINT        NOT NULL,
  from_status    order_status,
  to_status      order_status  NOT NULL,
  changed_by_id  BIGINT,
  reason         TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT fk_order_status_events_orders     FOREIGN KEY (order_id)      REFERENCES orders(id),
  CONSTRAINT fk_order_status_events_changed_by FOREIGN KEY (changed_by_id) REFERENCES users(id)
);

CREATE INDEX idx_order_status_events_order_id   ON order_status_events(order_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_order_status_events_created_at ON order_status_events(created_at DESC);
