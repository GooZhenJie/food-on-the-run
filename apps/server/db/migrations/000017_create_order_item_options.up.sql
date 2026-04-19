CREATE TABLE order_item_options (
  id                     BIGSERIAL PRIMARY KEY,
  order_item_id          BIGINT        NOT NULL,
  option_id              BIGINT,
  option_value_id        BIGINT,
  option_name            VARCHAR(100)  NOT NULL,
  option_value_name      VARCHAR(100)  NOT NULL,
  price_amount           BIGINT        NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,

  CONSTRAINT fk_order_item_options_order_items
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_item_options_option
    FOREIGN KEY (option_id) REFERENCES menu_item_options(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_item_options_option_value
    FOREIGN KEY (option_value_id) REFERENCES menu_item_option_values(id) ON DELETE SET NULL,
  CONSTRAINT chk_order_item_options_price CHECK (price_amount >= 0)
);

CREATE INDEX idx_order_item_options_order_item_id
  ON order_item_options(order_item_id)
  WHERE deleted_at IS NULL;
