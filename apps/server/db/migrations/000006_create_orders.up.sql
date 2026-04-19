CREATE TABLE orders (
  id                   BIGSERIAL     PRIMARY KEY,
  customer_id          BIGINT        NOT NULL,
  restaurant_id        BIGINT        NOT NULL,
  address_id           BIGINT,
  status               order_status  NOT NULL DEFAULT 'pending',
  subtotal_amount      BIGINT        NOT NULL,
  delivery_fee_amount  BIGINT        NOT NULL DEFAULT 0,
  total_amount         BIGINT        NOT NULL,
  note                 TEXT,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,

  CONSTRAINT fk_orders_customer    FOREIGN KEY (customer_id)   REFERENCES users(id),
  CONSTRAINT fk_orders_restaurants FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_orders_addresses   FOREIGN KEY (address_id)    REFERENCES addresses(id),
  CONSTRAINT chk_orders_subtotal   CHECK (subtotal_amount >= 0),
  CONSTRAINT chk_orders_total      CHECK (total_amount >= 0)
);

CREATE TABLE order_items (
  id            BIGSERIAL PRIMARY KEY,
  order_id      BIGINT        NOT NULL,
  menu_item_id  BIGINT        NOT NULL,
  name          VARCHAR(150)  NOT NULL,
  price_amount  BIGINT        NOT NULL,
  quantity      INT           NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,

  CONSTRAINT fk_order_items_orders     FOREIGN KEY (order_id)     REFERENCES orders(id),
  CONSTRAINT fk_order_items_menu_items FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
  CONSTRAINT chk_order_items_quantity  CHECK (quantity > 0),
  CONSTRAINT chk_order_items_price     CHECK (price_amount >= 0)
);

CREATE INDEX idx_orders_customer_id    ON orders(customer_id);
CREATE INDEX idx_orders_restaurant_id  ON orders(restaurant_id);
CREATE INDEX idx_orders_status         ON orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_created_at     ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id  ON order_items(order_id);
